import { getServiceRoleClient } from '@lib/supabaseClient';
import { getAppRouteUser } from '@lib/appRouteAuth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { user, error: authError } = await getAppRouteUser();
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabase = getServiceRoleClient();
    const staleCutoff = new Date(Date.now() - 30_000).toISOString();

    await supabase
      .from('agents')
      .update({ status: 'OFFLINE' })
      .eq('user_id', user.id)
      .eq('status', 'ONLINE')
      .lt('last_seen', staleCutoff);

    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name, status, last_seen, version, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: agents, agents });
  } catch (error) {
    console.error('API Error in /agents:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
