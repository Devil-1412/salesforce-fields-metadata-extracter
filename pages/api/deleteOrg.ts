import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { getAuthToken } from '@lib/cookieAuth';
import { deleteOrgSchema } from '@lib/validation/schemas';
import { validateRequestBody } from '@lib/validation/middleware';
import { validateContentType } from '@lib/contentTypeValidator';

interface DeleteOrgResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<DeleteOrgResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!validateContentType(req, res)) {
    return;
  }

  try {
    const validated = validateRequestBody(deleteOrgSchema, req, res);
    if (!validated) {
      return;
    }

    const { orgId } = validated;

    const token = getAuthToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing authentication token' });
    }

    const supabase = getServiceRoleClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, user_id')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    if (org.user_id !== profile.id) {
      return res.status(403).json({
        success: false,
        error: "You don't have permission to delete this organization",
      });
    }

    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', orgId)
      .eq('user_id', profile.id);

    if (deleteError) {
      console.error('Delete organization error:', deleteError.message);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete organization',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Organization deleted successfully',
    });
  } catch (err) {
    console.error('DeleteOrg API error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
