import type { NextApiRequest, NextApiResponse } from 'next';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { getAuthToken } from '@lib/cookieAuth';

interface Preferences {
  theme: string;
  notifications: boolean;
  emailUpdates: boolean;
  language: string;
}

interface UserPreferencesResponse {
  success: boolean;
  message?: string;
  preferences?: Preferences;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<UserPreferencesResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { action, preferences } = req.body;

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

    if (action === 'update') {
      if (!preferences) {
        return res.status(400).json({
          success: false,
          error: 'Missing preferences data',
        });
      }

      if (preferences.theme && !['light', 'dark'].includes(preferences.theme)) {
        return res.status(400).json({
          success: false,
          error: "Invalid theme. Must be 'light' or 'dark'",
        });
      }

      const validLanguages = ['en', 'es', 'fr', 'de'];
      if (preferences.language && !validLanguages.includes(preferences.language)) {
        return res.status(400).json({
          success: false,
          error: `Invalid language. Must be one of: ${validLanguages.join(', ')}`,
        });
      }

      const updateData: Record<string, unknown> = {
        user_id: profile.id,
        updated_at: new Date().toISOString(),
      };

      if (preferences.theme !== undefined) {
        updateData.theme = preferences.theme;
      }
      if (preferences.notifications !== undefined) {
        updateData.notifications = preferences.notifications;
      }
      if (preferences.emailUpdates !== undefined) {
        updateData.email_updates = preferences.emailUpdates;
      }
      if (preferences.language !== undefined) {
        updateData.language = preferences.language;
      }

      const { data: updatedPrefs, error: updateError } = await supabase
        .from('user_preferences')
        .upsert(updateData, { onConflict: 'user_id' })
        .select()
        .single();

      if (updateError) {
        console.error('Update preferences error:', updateError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to update preferences',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Preferences updated successfully',
        preferences: {
          theme: updatedPrefs.theme,
          notifications: updatedPrefs.notifications,
          emailUpdates: updatedPrefs.email_updates,
          language: updatedPrefs.language,
        },
      });
    } else if (action === 'get') {
      const { data: userPrefs, error: getError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', profile.id)
        .single();

      if (getError && getError.code !== 'PGRST116') {
        console.error('Get preferences error:', getError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch preferences',
        });
      }

      const defaultPrefs: Preferences = {
        theme: 'light',
        notifications: true,
        emailUpdates: true,
        language: 'en',
      };

      return res.status(200).json({
        success: true,
        preferences: userPrefs
          ? {
              theme: userPrefs.theme || defaultPrefs.theme,
              notifications: userPrefs.notifications ?? defaultPrefs.notifications,
              emailUpdates: userPrefs.email_updates ?? defaultPrefs.emailUpdates,
              language: userPrefs.language || defaultPrefs.language,
            }
          : defaultPrefs,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: `Unknown action: ${action}. Use 'update' or 'get'`,
      });
    }
  } catch (err) {
    console.error('UserPreferences API error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
}
