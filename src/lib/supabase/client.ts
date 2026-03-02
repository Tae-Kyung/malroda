import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// 서버 환경 스크립트(가령 Edge Function이나 Server API)에서는 Service Role Key를 사용해
// RLS를 우회하거나 더 강력한 권한으로 DB에 접근할 수 있습니다.
// 클라이언트 측이나 사용자 인증이 연계된 경우에는 Anon Key 권장합니다.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
