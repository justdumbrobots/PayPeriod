// ─── Enums ───────────────────────────────────────────────────────────────────

export type PayFrequency = 'bi-weekly' | 'weekly' | 'semi-monthly' | 'monthly'

export type BillFrequency = 'monthly' | 'bi-weekly' | 'weekly' | 'semi-monthly'

export type BillStatus = 'active' | 'paused' | 'ended'

export type BillCategory =
  | 'housing'
  | 'utilities'
  | 'auto'
  | 'insurance'
  | 'subscriptions'
  | 'health'
  | 'taxes'
  | 'discretionary'
  | 'debt'
  | 'family'
  | 'other'

export type AuthProvider = 'email' | 'google' | 'apple'

// ─── Data Entities ───────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  authUserId: string
  payFrequency: PayFrequency
  anchorPayDate: string // ISO 8601 YYYY-MM-DD
  incomePerPeriod: number
  sideIncome: number
  createdAt: string
}

export interface Bill {
  id: string
  userId: string
  name: string
  amount: number
  dueDay: number | null // 1-28 for monthly, null for bi-weekly/weekly
  frequency: BillFrequency
  category: BillCategory
  status: BillStatus
  sortOrder: number
  createdAt: string
}

export interface ExtraItem {
  id: string
  userId: string
  periodIndex: number
  amount: number // positive = expense, negative = income/credit
  note: string | null
  category: BillCategory | null
  createdAt: string
}

// ─── Computed Types ───────────────────────────────────────────────────────────

export interface PayPeriod {
  index: number
  payDate: Date
  nextPayDate: Date
  payDateStr: string   // MM-DD-YYYY display
  nextPayDateStr: string
}

export interface BillAssignment {
  bill: Bill
  amount: number
}

export interface ComputedPeriod {
  period: PayPeriod
  billAssignments: BillAssignment[]
  billTotal: number
  extraItems: ExtraItem[]
  extraTotal: number
  income: number
  net: number
  runningBalance: number
}

// ─── UI State ────────────────────────────────────────────────────────────────

export interface AuthState {
  userId: string | null
  email: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface OnboardingStep {
  step: 0 | 1 | 2 | 3 | 4
  completed: boolean
}

// ─── Category Metadata ────────────────────────────────────────────────────────

export const CATEGORY_META: Record<BillCategory, { label: string; color: string }> = {
  housing:       { label: 'Housing',         color: '#4FC3F7' },
  utilities:     { label: 'Utilities',        color: '#66BB6A' },
  auto:          { label: 'Auto/Transport',   color: '#FFA726' },
  insurance:     { label: 'Insurance',        color: '#AB47BC' },
  subscriptions: { label: 'Subscriptions',   color: '#EF5350' },
  health:        { label: 'Health/Fitness',   color: '#26A69A' },
  taxes:         { label: 'Taxes',            color: '#78909C' },
  discretionary: { label: 'Discretionary',   color: '#FFD54F' },
  debt:          { label: 'Debt Payments',    color: '#E57373' },
  family:        { label: 'Family/Personal',  color: '#7986CB' },
  other:         { label: 'Other',            color: '#90A4AE' },
}

export const BILL_FREQUENCY_LABELS: Record<BillFrequency, string> = {
  monthly:      'Monthly',
  'bi-weekly':  'Bi-Weekly',
  weekly:       'Weekly',
  'semi-monthly': 'Semi-Monthly',
}

export const PAY_FREQUENCY_LABELS: Record<PayFrequency, string> = {
  'bi-weekly':    'Bi-Weekly (Every 2 weeks)',
  weekly:         'Weekly',
  'semi-monthly': 'Semi-Monthly (1st & 15th)',
  monthly:        'Monthly',
}

export const QUICK_ADD_BILLS = [
  { name: 'Rent',         category: 'housing'       as BillCategory, frequency: 'monthly'   as BillFrequency, dueDay: 1  },
  { name: 'Mortgage',     category: 'housing'       as BillCategory, frequency: 'monthly'   as BillFrequency, dueDay: 1  },
  { name: 'Electric',     category: 'utilities'     as BillCategory, frequency: 'monthly'   as BillFrequency, dueDay: 15 },
  { name: 'Phone',        category: 'utilities'     as BillCategory, frequency: 'monthly'   as BillFrequency, dueDay: 15 },
  { name: 'Internet',     category: 'utilities'     as BillCategory, frequency: 'monthly'   as BillFrequency, dueDay: 20 },
  { name: 'Car Payment',  category: 'auto'          as BillCategory, frequency: 'monthly'   as BillFrequency, dueDay: 15 },
  { name: 'Gas',          category: 'auto'          as BillCategory, frequency: 'bi-weekly' as BillFrequency, dueDay: null },
  { name: 'Insurance',    category: 'insurance'     as BillCategory, frequency: 'monthly'   as BillFrequency, dueDay: 1  },
  { name: 'Netflix',      category: 'subscriptions' as BillCategory, frequency: 'monthly'   as BillFrequency, dueDay: 15 },
  { name: 'Gym',          category: 'health'        as BillCategory, frequency: 'monthly'   as BillFrequency, dueDay: 1  },
  { name: 'Groceries',    category: 'discretionary' as BillCategory, frequency: 'bi-weekly' as BillFrequency, dueDay: null },
]
