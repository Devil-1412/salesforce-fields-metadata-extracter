import { hashOpaqueToken, generateOpaqueToken } from '@lib/agents/auth';
import { getAppRouteUser } from '@lib/appRouteAuth';
import { getServiceRoleClient } from '@lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await getAppRouteUser();
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const pairingToken = generateOpaqueToken(24);
    const supabase = getServiceRoleClient();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase.from('pairing_tokens').insert({
      user_id: user.id,
      token_hash: hashOpaqueToken(pairingToken),
      expires_at: expiresAt,
    });

    if (error) {
      console.error('Error creating pairing token:', error);
      return NextResponse.json({ error: 'Failed to generate pairing token' }, { status: 500 });
    }

    return NextResponse.json({
      pairing_token: pairingToken,
      expires_at: expiresAt,
    });

  } catch (error) {
    console.error('API Error generating pairing token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
