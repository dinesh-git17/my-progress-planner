// src/utils/auth.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export function getLocalUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const userId = localStorage.getItem('user_id');
  return userId;
}

export function generateUserId(): string {
  let uuid;
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    uuid = crypto.randomUUID();
  } else {
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  return uuid;
}

export function setLocalUserId(user_id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('user_id', user_id);
}

// NEW AUTHENTICATION FUNCTIONS:

export async function signInWithGoogle() {

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('❌ Google sign in error:', error);
    throw error;
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Email sign in error:', error);
    throw error;
  }

  return data;
}

export async function signUpWithEmail(email: string, password: string) {

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('❌ Email sign up error:', error);
    throw error;
  }

  return data;
}

export async function signOut() {

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('❌ Sign out error:', error);
    throw error;
  }

}

export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('❌ Get session error:', error);
    return null;
  }

  return session;
}

export async function getUserName(user_id: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('name')
    .eq('user_id', user_id)
    .single();

  if (error || !data?.name) return null;
  return data.name;
}

export async function saveUserName(
  user_id: string,
  name: string,
): Promise<boolean> {
  const { error } = await supabase.from('users').upsert({ user_id, name });
  return !error;
}
