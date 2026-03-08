import { format, addDays } from 'date-fns'
import type { Bill, ExtraItem, PayPeriod, BillAssignment, ComputedPeriod, PayFrequency } from '../types'

// ─── Date Utilities ───────────────────────────────────────────────────────────

/** Format a date for display: MM-DD-YYYY */
export function formatDisplayDate(date: Date): string {
  return format(date, 'MM-dd-yyyy')
}

/** Parse ISO date string to Date */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Format Date to ISO storage string */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

// ─── Period Generation ────────────────────────────────────────────────────────

/** Number of days between pay periods for each frequency */
const PERIOD_DAYS: Record<PayFrequency, number> = {
  weekly:        7,
  'bi-weekly':   14,
  'semi-monthly': 0, // special case
  monthly:       0,  // special case
}

/** Get the next pay date after `current` for a given frequency */
function nextPayDate(current: Date, frequency: PayFrequency, anchorDate: Date): Date {
  if (frequency === 'bi-weekly' || frequency === 'weekly') {
    return addDays(current, PERIOD_DAYS[frequency])
  }

  if (frequency === 'semi-monthly') {
    // Pay on 1st and 15th
    const day = current.getDate()
    if (day < 15) {
      return new Date(current.getFullYear(), current.getMonth(), 15)
    } else {
      return new Date(current.getFullYear(), current.getMonth() + 1, 1)
    }
  }

  if (frequency === 'monthly') {
    return new Date(current.getFullYear(), current.getMonth() + 1, anchorDate.getDate())
  }

  return addDays(current, 14)
}

/** Generate N pay periods starting from anchor date */
export function generatePayPeriods(
  anchorPayDate: string,
  frequency: PayFrequency,
  count: number = 800,
): PayPeriod[] {
  const anchor = parseISODate(anchorPayDate)
  const periods: PayPeriod[] = []
  let current = anchor

  for (let i = 0; i < count; i++) {
    const next = nextPayDate(current, frequency, anchor)
    periods.push({
      index: i,
      payDate: current,
      nextPayDate: next,
      payDateStr: formatDisplayDate(current),
      nextPayDateStr: formatDisplayDate(next),
    })
    current = next
  }

  return periods
}

// ─── Bill Engine ──────────────────────────────────────────────────────────────

/**
 * Determine how much a single bill contributes to a pay period.
 * Replicates the Excel per-bill-per-period formula architecture exactly.
 */
export function billAmountForPeriod(bill: Bill, period: PayPeriod): number {
  if (bill.status !== 'active') return 0

  const { payDate, nextPayDate } = period

  if (bill.frequency === 'bi-weekly' || bill.frequency === 'weekly') {
    // Always included in every period
    return bill.amount
  }

  if (bill.frequency === 'monthly') {
    if (bill.dueDay === null) return 0
    // Check current month's due date
    const d1 = new Date(payDate.getFullYear(), payDate.getMonth(), bill.dueDay)
    // Check next month's due date (handles periods that cross month boundaries)
    const d2 = new Date(payDate.getFullYear(), payDate.getMonth() + 1, bill.dueDay)
    if (
      (d1 >= payDate && d1 < nextPayDate) ||
      (d2 >= payDate && d2 < nextPayDate)
    ) {
      return bill.amount
    }
    return 0
  }

  if (bill.frequency === 'semi-monthly') {
    // Two due days: 1st and 15th of each month
    const dueDays = bill.dueDay ? [bill.dueDay, bill.dueDay === 1 ? 15 : 1] : [1, 15]
    for (const day of dueDays) {
      const d1 = new Date(payDate.getFullYear(), payDate.getMonth(), day)
      const d2 = new Date(payDate.getFullYear(), payDate.getMonth() + 1, day)
      if (
        (d1 >= payDate && d1 < nextPayDate) ||
        (d2 >= payDate && d2 < nextPayDate)
      ) {
        return bill.amount
      }
    }
    return 0
  }

  return 0
}

/**
 * Compute a full pay period with bill assignments, extras, and running balance.
 */
export function computePeriod(
  period: PayPeriod,
  bills: Bill[],
  extras: ExtraItem[],
  income: number,
  previousBalance: number,
): ComputedPeriod {
  const billAssignments: BillAssignment[] = []
  let billTotal = 0

  for (const bill of bills) {
    const amount = billAmountForPeriod(bill, period)
    if (amount > 0) {
      billAssignments.push({ bill, amount })
    }
    billTotal += amount
  }

  const periodExtras = extras.filter(e => e.periodIndex === period.index)
  const extraTotal = periodExtras.reduce((sum, e) => sum + e.amount, 0)

  const net = income - (billTotal + extraTotal)
  const runningBalance = previousBalance + net

  return {
    period,
    billAssignments,
    billTotal,
    extraItems: periodExtras,
    extraTotal,
    income,
    net,
    runningBalance,
  }
}

/**
 * Compute all periods with running balances.
 */
export function computeAllPeriods(
  periods: PayPeriod[],
  bills: Bill[],
  extras: ExtraItem[],
  incomePerPeriod: number,
  sideIncome: number,
  startingBalance: number = 0,
): ComputedPeriod[] {
  const totalIncome = incomePerPeriod + sideIncome
  const computed: ComputedPeriod[] = []
  let runningBalance = startingBalance

  for (const period of periods) {
    const cp = computePeriod(period, bills, extras, totalIncome, runningBalance)
    computed.push(cp)
    runningBalance = cp.runningBalance
  }

  return computed
}

// ─── Current Period Detection ─────────────────────────────────────────────────

/** Find the index of the current or next upcoming pay period */
export function findCurrentPeriodIndex(periods: PayPeriod[]): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < periods.length; i++) {
    const p = periods[i]
    const payDate = new Date(p.payDate)
    payDate.setHours(0, 0, 0, 0)
    const nextDate = new Date(p.nextPayDate)
    nextDate.setHours(0, 0, 0, 0)

    if (today >= payDate && today < nextDate) return i
    if (today < payDate) return i
  }

  return periods.length - 1
}

// ─── Monthly Summary ──────────────────────────────────────────────────────────

export interface MonthlySummary {
  totalIncome: number
  totalBills: number
  freeCash: number
  periodsPerMonth: number
}

/** Approximate monthly summary from per-period amounts */
export function getMonthlySummary(
  incomePerPeriod: number,
  sideIncome: number,
  bills: Bill[],
  frequency: PayFrequency,
): MonthlySummary {
  const periodsPerMonth = frequency === 'weekly' ? 4.33
    : frequency === 'bi-weekly' ? 2.17
    : frequency === 'semi-monthly' ? 2
    : 1

  const totalIncome = (incomePerPeriod + sideIncome) * periodsPerMonth

  // Calculate average monthly bills
  let monthlyBills = 0
  for (const bill of bills) {
    if (bill.status !== 'active') continue
    if (bill.frequency === 'monthly' || bill.frequency === 'semi-monthly') {
      monthlyBills += bill.amount
    } else if (bill.frequency === 'bi-weekly') {
      monthlyBills += bill.amount * 2.17
    } else if (bill.frequency === 'weekly') {
      monthlyBills += bill.amount * 4.33
    }
  }

  return {
    totalIncome,
    totalBills: monthlyBills,
    freeCash: totalIncome - monthlyBills,
    periodsPerMonth,
  }
}

// ─── Category Spending ────────────────────────────────────────────────────────

export interface CategorySpend {
  category: string
  amount: number
  color: string
}
