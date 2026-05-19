import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/tips?location=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location');

  const supabase = await createClient();
  
  let query = supabase.from('tips').select('*');
  
  if (location) {
    query = query.eq('location', location);
  }
  
  const { data: tips, error } = await query.order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(tips);
}
