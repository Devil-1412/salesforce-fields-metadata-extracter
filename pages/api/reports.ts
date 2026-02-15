import { validateContentType } from '@lib/contentTypeValidator';
import { getAuthToken } from '@lib/cookieAuth';
import { handleApiError } from '@lib/errorHandler';
import { jsforceRateLimiter } from '@lib/rateLimiter';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { validateRequestBody } from '@lib/validation/middleware';
import { reportSchema, updateReportStatusSchema } from '@lib/validation/schemas';
import type { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: List reports
  if (req.method === 'GET') {
    try {
      const supabase = getServiceRoleClient();
      const { cursor, limit = 10, status, type } = req.query;

      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(Number(limit));

      if (cursor) {
        query = query.lt('created_at', cursor);
      }
      if (status) {
        query = query.eq('status', status);
      }
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json({ success: true, reports: data });
    } catch (error) {
      return handleApiError(error, req, res, 'list_reports');
    }
  }

  // POST: Create report
  if (req.method === 'POST') {
    if (!validateContentType(req, res)) return;

    // Validate body
    const validated = validateRequestBody(reportSchema, req, res);
    if (!validated) return;

    try {
      const supabase = getServiceRoleClient();

      // Get User ID from Auth Token
      const token = getAuthToken(req);
      if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({ success: false, error: 'Invalid session' });
      }

      const { title, description, type, images } = validated;

      const { data, error } = await supabase
        .from('reports')
        .insert({
          user_id: user.id,
          title,
          description,
          type,
          images: images || [],
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ success: true, report: data });
    } catch (error) {
      return handleApiError(error, req, res, 'create_report');
    }
  }

  // PATCH: Update status (Admin only)
  if (req.method === 'PATCH') {
    if (!validateContentType(req, res)) return;

    const validated = validateRequestBody(updateReportStatusSchema, req, res);
    if (!validated) return;

    try {
      const supabase = getServiceRoleClient();

      // Get User & Check Role
      const token = getAuthToken(req);
      if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user)
        return res.status(401).json({ success: false, error: 'Invalid session' });

      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
      }

      const { reportId, status } = validated;

      const { data, error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ success: true, report: data });
    } catch (error) {
      return handleApiError(error, req, res, 'update_report');
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}

export default jsforceRateLimiter(handler);
