import { create } from 'zustand'
import { generateId } from '../lib/format'
import { generatePayPeriods, computeAllPeriods, findCurrentPeriodIndex } from '../lib/billEngine'
import {
  fetchUserProfile, fetchBills, fetchExtraItems,
  upsertUserProfile, upsertBill, deleteBill as apiDeleteBill,
  upsertExtraItem, deleteExtraItem as apiDeleteExtraItem,
} from '../lib/supabase'
import {
  cacheProfile, cacheBills, cacheExtraItems,
  getCachedProfile, getCachedBills, getCachedExtraItems,
} from '../lib/db'
import type {
  UserProfile, Bill, ExtraItem, PayPeriod, ComputedPeriod,
  PayFrequency, BillFrequency, BillCategory, BillStatus,
} from '../types'

interface BudgetStore {
  // Data
  profile: UserProfile | null
  bills: Bill[]
  extraItems: ExtraItem[]

  // Computed
  periods: PayPeriod[]
  computedPeriods: ComputedPeriod[]
  currentPeriodIndex: number

  // State
  isLoading: boolean
  hasData: boolean
  startingBalance: number

  // Onboarding
  onboardingComplete: boolean

  // Actions
  loadData: (userId: string) => Promise<void>
  saveProfile: (userId: string, data: Partial<UserProfile>) => Promise<void>
  addBill: (userId: string, bill: Omit<Bill, 'id' | 'userId' | 'sortOrder' | 'createdAt'>) => Promise<void>
  updateBill: (bill: Bill) => Promise<void>
  removeBill: (billId: string) => Promise<void>
  addExtraItem: (userId: string, item: Omit<ExtraItem, 'id' | 'userId' | 'createdAt'>) => Promise<void>
  updateExtraItem: (item: ExtraItem) => Promise<void>
  removeExtraItem: (itemId: string) => Promise<void>
  setStartingBalance: (amount: number) => void
  recompute: () => void
  setOnboardingComplete: (v: boolean) => void
  reset: () => void
}

const DEFAULT_PERIOD_COUNT = 800

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  profile: null,
  bills: [],
  extraItems: [],
  periods: [],
  computedPeriods: [],
  currentPeriodIndex: 0,
  isLoading: false,
  hasData: false,
  startingBalance: 0,
  onboardingComplete: false,

  loadData: async (userId: string) => {
    set({ isLoading: true })
    try {
      // Try remote first, fall back to local cache
      let profile: UserProfile | null = null
      let bills: Bill[] = []
      let extraItems: ExtraItem[] = []

      const [profileRes, billsRes, extrasRes] = await Promise.all([
        fetchUserProfile(userId),
        fetchBills(userId),
        fetchExtraItems(userId),
      ])

      if (profileRes.data) {
        profile = mapDbProfile(profileRes.data)
        await cacheProfile(profile)
      } else {
        const cached = await getCachedProfile(userId)
        if (cached) profile = cached
      }

      if (!billsRes.error && billsRes.data !== null) {
        bills = billsRes.data.map(mapDbBill)
        await cacheBills(bills)
      } else {
        bills = await getCachedBills(userId)
      }

      if (!extrasRes.error && extrasRes.data !== null) {
        extraItems = extrasRes.data.map(mapDbExtra)
        await cacheExtraItems(extraItems)
      } else {
        extraItems = await getCachedExtraItems(userId)
      }

      if (!profile) {
        set({ isLoading: false, hasData: false })
        return
      }

      const periods = generatePayPeriods(profile.anchorPayDate, profile.payFrequency, DEFAULT_PERIOD_COUNT)
      const computedPeriods = computeAllPeriods(
        periods, bills, extraItems,
        profile.incomePerPeriod, profile.sideIncome,
        get().startingBalance,
      )
      const currentPeriodIndex = findCurrentPeriodIndex(periods)

      set({
        profile, bills, extraItems,
        periods, computedPeriods, currentPeriodIndex,
        isLoading: false, hasData: true,
        onboardingComplete: true,
      })
    } catch (err) {
      console.error('Failed to load data:', err)
      set({ isLoading: false })
    }
  },

  saveProfile: async (userId: string, data: Partial<UserProfile>) => {
    const existing = get().profile
    const updated: UserProfile = {
      id: existing?.id ?? generateId(),
      authUserId: userId,
      payFrequency: 'bi-weekly',
      anchorPayDate: new Date().toISOString().split('T')[0],
      incomePerPeriod: 0,
      sideIncome: 0,
      createdAt: new Date().toISOString(),
      ...existing,
      ...data,
    }

    await upsertUserProfile({
      auth_user_id: userId,
      pay_frequency: updated.payFrequency,
      anchor_pay_date: updated.anchorPayDate,
      income_per_period: updated.incomePerPeriod,
      side_income: updated.sideIncome,
    })
    await cacheProfile(updated)

    const periods = generatePayPeriods(updated.anchorPayDate, updated.payFrequency, DEFAULT_PERIOD_COUNT)
    const { bills, extraItems, startingBalance } = get()
    const computedPeriods = computeAllPeriods(periods, bills, extraItems, updated.incomePerPeriod, updated.sideIncome, startingBalance)
    const currentPeriodIndex = findCurrentPeriodIndex(periods)

    set({ profile: updated, periods, computedPeriods, currentPeriodIndex, hasData: true })
  },

  addBill: async (userId: string, billData) => {
    const { bills } = get()
    const bill: Bill = {
      id: generateId(),
      userId,
      sortOrder: bills.length,
      createdAt: new Date().toISOString(),
      ...billData,
    }

    const insertResult = await upsertBill({
      id: bill.id,
      user_id: bill.userId,
      name: bill.name,
      amount: bill.amount,
      due_day: bill.dueDay,
      frequency: bill.frequency,
      category: bill.category,
      status: bill.status,
      sort_order: bill.sortOrder,
    })
    if (insertResult.error) throw new Error(insertResult.error.message)

    const updatedBills = [...bills, bill]
    await cacheBills(updatedBills)
    set({ bills: updatedBills })
    get().recompute()
  },

  updateBill: async (bill: Bill) => {
    const updateResult = await upsertBill({
      id: bill.id,
      user_id: bill.userId,
      name: bill.name,
      amount: bill.amount,
      due_day: bill.dueDay,
      frequency: bill.frequency,
      category: bill.category,
      status: bill.status,
      sort_order: bill.sortOrder,
    })
    if (updateResult.error) throw new Error(updateResult.error.message)

    const updatedBills = get().bills.map(b => b.id === bill.id ? bill : b)
    await cacheBills(updatedBills)
    set({ bills: updatedBills })
    get().recompute()
  },

  removeBill: async (billId: string) => {
    await apiDeleteBill(billId)
    const updatedBills = get().bills.filter(b => b.id !== billId)
    await cacheBills(updatedBills)
    set({ bills: updatedBills })
    get().recompute()
  },

  addExtraItem: async (userId: string, itemData) => {
    const item: ExtraItem = {
      id: generateId(),
      userId,
      createdAt: new Date().toISOString(),
      ...itemData,
    }

    await upsertExtraItem({
      id: item.id,
      user_id: item.userId,
      period_index: item.periodIndex,
      amount: item.amount,
      note: item.note,
      category: item.category,
    })

    const updatedExtras = [...get().extraItems, item]
    await cacheExtraItems(updatedExtras)
    set({ extraItems: updatedExtras })
    get().recompute()
  },

  updateExtraItem: async (item: ExtraItem) => {
    await upsertExtraItem({
      id: item.id,
      user_id: item.userId,
      period_index: item.periodIndex,
      amount: item.amount,
      note: item.note,
      category: item.category,
    })

    const updatedExtras = get().extraItems.map(e => e.id === item.id ? item : e)
    await cacheExtraItems(updatedExtras)
    set({ extraItems: updatedExtras })
    get().recompute()
  },

  removeExtraItem: async (itemId: string) => {
    await apiDeleteExtraItem(itemId)
    const updatedExtras = get().extraItems.filter(e => e.id !== itemId)
    await cacheExtraItems(updatedExtras)
    set({ extraItems: updatedExtras })
    get().recompute()
  },

  setStartingBalance: (amount: number) => {
    set({ startingBalance: amount })
    get().recompute()
  },

  recompute: () => {
    const { periods, bills, extraItems, profile, startingBalance } = get()
    if (!profile || periods.length === 0) return

    const computedPeriods = computeAllPeriods(
      periods, bills, extraItems,
      profile.incomePerPeriod, profile.sideIncome,
      startingBalance,
    )
    const currentPeriodIndex = findCurrentPeriodIndex(periods)
    set({ computedPeriods, currentPeriodIndex })
  },

  setOnboardingComplete: (v: boolean) => set({ onboardingComplete: v }),

  reset: () => set({
    profile: null, bills: [], extraItems: [],
    periods: [], computedPeriods: [], currentPeriodIndex: 0,
    hasData: false, onboardingComplete: false, startingBalance: 0,
  }),
}))

// ─── DB Row Mappers ───────────────────────────────────────────────────────────

function mapDbProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    authUserId: (row.auth_user_id ?? row.authUserId) as string,
    payFrequency: (row.pay_frequency ?? row.payFrequency) as PayFrequency,
    anchorPayDate: (row.anchor_pay_date ?? row.anchorPayDate) as string,
    incomePerPeriod: Number(row.income_per_period ?? row.incomePerPeriod ?? 0),
    sideIncome: Number(row.side_income ?? row.sideIncome ?? 0),
    createdAt: (row.created_at ?? row.createdAt) as string,
  }
}

function mapDbBill(row: Record<string, unknown>): Bill {
  return {
    id: row.id as string,
    userId: (row.user_id ?? row.userId) as string,
    name: row.name as string,
    amount: Number(row.amount),
    dueDay: row.due_day != null ? Number(row.due_day) : row.dueDay != null ? Number(row.dueDay) : null,
    frequency: (row.frequency) as BillFrequency,
    category: (row.category) as BillCategory,
    status: (row.status) as BillStatus,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0),
    createdAt: (row.created_at ?? row.createdAt) as string,
  }
}

function mapDbExtra(row: Record<string, unknown>): ExtraItem {
  return {
    id: row.id as string,
    userId: (row.user_id ?? row.userId) as string,
    periodIndex: Number(row.period_index ?? row.periodIndex ?? 0),
    amount: Number(row.amount),
    note: (row.note as string) ?? null,
    category: (row.category as BillCategory) ?? null,
    createdAt: (row.created_at ?? row.createdAt) as string,
  }
}
