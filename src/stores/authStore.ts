import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { clearUserCache } from '../lib/db'
import type { User, Session } from '@supabase/supabase-js'

interface AuthStore {
  user: User | null
  session: Session | null
  isLoading: boolean
  isInitialized: boolean

  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (v: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),

  signOut: async () => {
    const { user } = get()
    if (user) await clearUserCache(user.id)
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
