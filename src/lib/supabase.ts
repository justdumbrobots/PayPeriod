import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not set. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'payperiod-auth',
    },
  },
)

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/PayPeriod/` },
  })
}

export async function signInWithApple() {
  return supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: { redirectTo: window.location.origin },
  })
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export async function getSession() {
  return supabase.auth.getSession()
}

// ─── Data Helpers ─────────────────────────────────────────────────────────────

export async function fetchUserProfile(userId: string) {
  return supabase.from('user_profiles').select('*').eq('auth_user_id', userId).single()
}

export async function upsertUserProfile(profile: {
  auth_user_id: string
  pay_frequency: string
  anchor_pay_date: string
  income_per_period: number
  side_income: number
}) {
  return supabase.from('user_profiles').upsert(profile, { onConflict: 'auth_user_id' }).select().single()
}

export async function fetchBills(userId: string) {
  return supabase
    .from('bills')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
}

export async function upsertBill(bill: Record<string, unknown>) {
  return supabase.from('bills').upsert(bill).select().single()
}

export async function deleteBill(billId: string) {
  return supabase.from('bills').delete().eq('id', billId)
}

export async function fetchExtraItems(userId: string) {
  return supabase.from('extra_items').select('*').eq('user_id', userId)
}

export async function upsertExtraItem(item: Record<string, unknown>) {
  return supabase.from('extra_items').upsert(item).select().single()
}

export async function deleteExtraItem(itemId: string) {
  return supabase.from('extra_items').delete().eq('id', itemId)
}

export async function deleteAccount(userId: string) {
  // Delete user data (RLS cascade handles the rest)
  await supabase.from('extra_items').delete().eq('user_id', userId)
  await supabase.from('bills').delete().eq('user_id', userId)
  await supabase.from('user_profiles').delete().eq('auth_user_id', userId)
  return supabase.auth.admin?.deleteUser(userId)
}
