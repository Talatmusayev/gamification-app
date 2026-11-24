import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuthActionResult {
  ok: boolean;
  user: User | null;
  error: string | null;
}

export interface DeleteAccountResult {
  ok: boolean;
  deleted: boolean;
  error: string | null;
}

const UNAVAILABLE_MESSAGE =
  'Cloud sync is currently unavailable. You can continue using your garden offline.';

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!supabase) {
    return { ok: false, user: null, error: UNAVAILABLE_MESSAGE };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      return { ok: false, user: null, error: error.message };
    }
    return { ok: true, user: data.user ?? null, error: null };
  } catch (err) {
    return {
      ok: false,
      user: null,
      error: err instanceof Error ? err.message : 'Unable to create account right now.',
    };
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!supabase) {
    return { ok: false, user: null, error: UNAVAILABLE_MESSAGE };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      return { ok: false, user: null, error: error.message };
    }
    return { ok: true, user: data.user ?? null, error: null };
  } catch (err) {
    return {
      ok: false,
      user: null,
      error: err instanceof Error ? err.message : 'Unable to sign in right now.',
    };
  }
}

export async function signOut(): Promise<{ ok: boolean; error: string | null }> {
  if (!supabase) {
    return { ok: true, error: null };
  }

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unable to sign out right now.',
    };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function deleteAccount(): Promise<DeleteAccountResult> {
  if (!supabase) {
    return { ok: false, deleted: false, error: UNAVAILABLE_MESSAGE };
  }

  try {
    const { data, error } = await supabase.functions.invoke<{ deleted?: boolean }>(
      'dew-delete-account',
    );
    if (error) {
      return { ok: false, deleted: false, error: error.message };
    }
    if (!data?.deleted) {
      return {
        ok: false,
        deleted: false,
        error: 'Account deletion could not be confirmed. Please try again.',
      };
    }

    await supabase.auth.signOut().catch(() => {});
    return { ok: true, deleted: true, error: null };
  } catch (err) {
    return {
      ok: false,
      deleted: false,
      error: err instanceof Error ? err.message : 'Unable to delete account right now.',
    };
  }
}
