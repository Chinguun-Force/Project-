import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { inviteCode } = await req.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Find session by invite code
    const { data: session, error: sError } = await supabase
      .from('sessions')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('is_active', true)
      .single();

    if (sError || !session) {
      return NextResponse.json({ error: 'Invalid or inactive invite code' }, { status: 404 });
    }

    // 2. In a real app, you might create a session_participants entry.
    // For this MVP, joining just returns the session ID and the user stores it in local state.
    // We can also ensure the user has a 'tourist' role if they don't have one.

    return NextResponse.json({
      message: 'Joined successfully',
      session
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
