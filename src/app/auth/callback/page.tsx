'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {


      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Auth callback error:', error);
          router.push('/?error=auth_failed');
          return;
        }

        if (data.session) {

          router.push('/');
        } else {

          router.push('/');
        }
      } catch (error) {
        console.error('💥 Auth callback exception:', error);
        router.push('/?error=auth_exception');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">
          Completing your login...
        </h1>
        <p className="text-gray-500">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}
