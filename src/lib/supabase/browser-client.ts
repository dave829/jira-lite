import { createClient } from '@supabase/supabase-js';

// ✅ 단순 브라우저 클라이언트 (가이드 패턴)
// 클라이언트 컴포넌트에서 사용
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 사용법:
// import { supabase } from '@/lib/supabase/browser-client';
// const { data } = await supabase.from('projects').select('*');
