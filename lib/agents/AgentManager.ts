/**
 * AgentManager Service
 * Manages active WebSocket connections to Oracle Desktop Agents.
 * Note: In a multi-instance (serverless) environment, this in-memory map
 * will only work if sticky sessions or a single Node server is used.
 * For true scale-out, a pub/sub mechanism (like Redis) should back this.
 */

import { getServiceRoleClient } from '../supabaseClient';

export interface AgentJob {
  type: 'EXECUTE_QUERY' | 'HEARTBEAT_ACK';
  job_id?: string;
  query?: string;
  [key: string]: any;
}

export interface JobResult {
  type: 'JOB_RESULT' | 'HEARTBEAT';
  job_id?: string;
  agent_id?: string;
  rows?: any[];
  error?: string;
}

export class AgentManager {
  private static instance: AgentManager;
  private connections: Map<string, any> = new Map(); // agent_id -> WebSocket
  private pendingJobs: Map<string, (result: any) => void> = new Map(); // job_id -> resolve function

  private constructor() {}

  public static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  /**
   * Registers a new WebSocket connection for an agent
   */
  public registerAgent(agentId: string, socket: any) {
    this.connections.set(agentId, socket);
    console.log(`[AgentManager] Agent registered: ${agentId}`);

    // Update status to ONLINE in DB
    this.updateAgentStatus(agentId, 'ONLINE');

    socket.on('close', () => {
      this.removeAgent(agentId);
    });

    socket.on('message', async (data: string) => {
      try {
        const payload: JobResult = JSON.parse(data.toString());
        await this.handleMessage(agentId, payload);
      } catch (err) {
        console.error(`[AgentManager] Failed to parse message from agent ${agentId}:`, err);
      }
    });
  }

  /**
   * Removes an agent from the active connections
   */
  public removeAgent(agentId: string) {
    this.connections.delete(agentId);
    console.log(`[AgentManager] Agent disconnected: ${agentId}`);

    // Update status to OFFLINE in DB
    this.updateAgentStatus(agentId, 'OFFLINE');
  }

  /**
   * Update agent status in DB
   */
  private async updateAgentStatus(agentId: string, status: 'ONLINE' | 'OFFLINE') {
    const supabase = getServiceRoleClient();
    await supabase
      .from('agents')
      .update({ status, last_seen: new Date().toISOString() })
      .eq('id', agentId);
  }

  /**
   * Sends a job to an active agent and waits for the result
   */
  public async sendJob(agentId: string, job: AgentJob): Promise<any> {
    const socket = this.connections.get(agentId);
    if (!socket || socket.readyState !== 1 /* WebSocket.OPEN */) {
      throw new Error(`Agent ${agentId} is not connected or socket is closed.`);
    }

    if (job.type === 'EXECUTE_QUERY' && job.job_id) {
      return new Promise((resolve, reject) => {
        // Timeout job after 2 minutes
        const timeoutId = setTimeout(() => {
          this.pendingJobs.delete(job.job_id!);
          reject(new Error(`Timeout waiting for job ${job.job_id} from agent ${agentId}`));
        }, 120_000);

        this.pendingJobs.set(job.job_id, (result) => {
          clearTimeout(timeoutId);
          if (result.error) {
            reject(new Error(result.error));
          } else {
            resolve(result.rows);
          }
        });

        // Send job payload
        socket.send(JSON.stringify(job));
      });
    }

    return null;
  }

  /**
   * Handles incoming messages from agents (Heartbeats, Results)
   */
  private async handleMessage(agentId: string, message: JobResult) {
    if (message.type === 'HEARTBEAT') {
      await this.updateAgentStatus(agentId, 'ONLINE');
      // Ack the heartbeat
      const socket = this.connections.get(agentId);
      if (socket) {
        socket.send(JSON.stringify({ type: 'HEARTBEAT_ACK' }));
      }
      return;
    }

    if (message.type === 'JOB_RESULT' && message.job_id) {
      const resolver = this.pendingJobs.get(message.job_id);
      if (resolver) {
        resolver(message);
        this.pendingJobs.delete(message.job_id);
      }

      // Update job status in DB
      const supabase = getServiceRoleClient();
      await supabase
        .from('agent_jobs')
        .update({
          status: message.error ? 'FAILED' : 'COMPLETED',
          result: message.rows || null,
          error: message.error || null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', message.job_id);
    }
  }

  public getConnectedAgentIds(): string[] {
    return Array.from(this.connections.keys());
  }
}

export const agentManager = AgentManager.getInstance();
