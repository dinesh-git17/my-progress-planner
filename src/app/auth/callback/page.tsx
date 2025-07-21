'use client';

import { useNavigation } from '@/contexts/NavigationContext';
import { createClient } from '@supabase/supabase-js';
import { useEffect } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function AuthCallback() {
  const { navigate } = useNavigation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🔄 Processing auth callback...');

      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Auth callback error:', error);
          navigate('/?error=auth_failed');
          return;
        }

        if (data.session) {
          console.log('✅ Auth successful, redirecting to home');
          navigate('/');
        } else {
          console.log('⚠️ No session found, redirecting to home');
          navigate('/');
        }
      } catch (error) {
        console.error('💥 Auth callback exception:', error);
        navigate('/?error=auth_exception');
      }
    };

    handleAuthCallback();
  }, [navigate]);

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
