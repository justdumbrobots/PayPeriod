import { useMemo } from 'react'
import { TrendingUp, DollarSign, CreditCard, Activity } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { MetricCard } from '../components/ui/Card'
import { useBudgetStore } from '../stores/budgetStore'
import { useUIStore } from '../stores/uiStore'
import { formatCurrency } from '../lib/format'
import { getMonthlySummary } from '../lib/billEngine'
import { CATEGORY_META } from '../types'

export function Dashboard() {
  const { computedPeriods, currentPeriodIndex, profile, bills } = useBudgetStore()
  const { setActiveTab, setSelectedPeriod } = useUIStore()

  const currentPeriod = computedPeriods[currentPeriodIndex]
  const pastPeriod = computedPeriods[Math.max(0, currentPeriodIndex - 1)]
  const upcomingPeriods = computedPeriods.slice(currentPeriodIndex, currentPeriodIndex + 6)

  const monthlySummary = useMemo(() => {
    if (!profile) return null
    return getMonthlySummary(profile.incomePerPeriod, profile.sideIncome, bills, profile.payFrequency)
  }, [profile, bills])

  // Category spending data for pie chart
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const bill of bills) {
      if (bill.status !== 'active') continue
      const cat = bill.category
      totals[cat] = (totals[cat] || 0) + bill.amount
    }
    return Object.entries(totals)
      .filter(([, v]) => v > 0)
      .map(([cat, value]) => ({
        name: CATEGORY_META[cat as keyof typeof CATEGORY_META]?.label ?? cat,
        value: Math.round(value),
        color: CATEGORY_META[cat as keyof typeof CATEGORY_META]?.color ?? '#90A4AE',
      }))
      .sort((a, b) => b.value - a.value)
  }, [bills])

  if (!profile || !currentPeriod) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#90CAF9]">
        No data yet. Complete setup to get started.
      </div>
    )
  }

  const currentBalance = pastPeriod?.runningBalance ?? 0

  return (
    <div className="flex-1 overflow-y-auto smooth-scroll pb-20">
      {/* Header */}
      <div className="bg-[#162447] px-5 pt-6 pb-5 safe-top">
        <p className="text-xs text-[#90CAF9] uppercase tracking-wider mb-1">Current Balance</p>
        <h1 className={`text-4xl font-bold ${currentBalance >= 0 ? 'text-[#4DD0E1]' : 'text-[#EF5350]'}`}>
          {formatCurrency(currentBalance)}
        </h1>
        <p className="text-xs text-[#4a6080] mt-1">
          Next pay: {currentPeriod.period.payDateStr}
        </p>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-5">
        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Income / Period"
            value={formatCurrency(profile.incomePerPeriod + profile.sideIncome)}
            valueColor="#66BB6A"
            icon={<DollarSign size={16} />}
          />
          <MetricCard
            label="Last Bills"
            value={formatCurrency(pastPeriod?.billTotal ?? 0)}
            valueColor="#EF5350"
            icon={<CreditCard size={16} />}
          />
          <MetricCard
            label="Last Net"
            value={formatCurrency(pastPeriod?.net ?? 0)}
            valueColor={( pastPeriod?.net ?? 0) >= 0 ? '#FFD740' : '#EF5350'}
            icon={<TrendingUp size={16} />}
          />
          <MetricCard
            label="Active Bills"
            value={String(bills.filter(b => b.status === 'active').length)}
            icon={<Activity size={16} />}
          />
        </div>

        {/* Monthly summary */}
        {monthlySummary && (
          <div className="bg-[#162447] rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-[#90CAF9] uppercase tracking-wider mb-3">Monthly Summary</h2>
            <div className="flex flex-col gap-2">
              <SummaryRow label="Monthly Income" value={monthlySummary.totalIncome} color="text-[#66BB6A]" />
              <SummaryRow label="Monthly Bills" value={monthlySummary.totalBills} color="text-[#EF5350]" />
              <div className="h-px bg-[#1F4068] my-1" />
              <SummaryRow label="Free Cash" value={monthlySummary.freeCash} color={monthlySummary.freeCash >= 0 ? 'text-[#FFD740]' : 'text-[#EF5350]'} bold />
            </div>
          </div>
        )}

        {/* Spending by category chart */}
        {categoryData.length > 0 && (
          <div className="bg-[#162447] rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-[#90CAF9] uppercase tracking-wider mb-3">Spending by Category</h2>
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {categoryData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#162447', border: '1px solid #1F4068', borderRadius: 8 }}
                    labelStyle={{ color: '#90CAF9' }}
                    formatter={(v) => [formatCurrency(Number(v)), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                {categoryData.slice(0, 6).map(c => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                    <span className="text-xs text-[#E0E0E0] truncate flex-1">{c.name}</span>
                    <span className="text-xs font-medium" style={{ color: c.color }}>{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming periods */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#90CAF9] uppercase tracking-wider">Upcoming Periods</h2>
            <button
              onClick={() => setActiveTab('timeline')}
              className="text-xs text-[#64B5F6]"
            >
              View All
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {upcomingPeriods.map(cp => (
              <button
                key={cp.period.index}
                onClick={() => {
                  setSelectedPeriod(cp.period.index)
                  setActiveTab('timeline')
                }}
                className="w-full bg-[#162447] rounded-xl p-4 text-left active:scale-98 transition-transform"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[#E0E0E0]">{cp.period.payDateStr}</span>
                  <span className={`text-sm font-bold ${cp.net >= 0 ? 'text-[#FFD740]' : 'text-[#EF5350]'}`}>
                    {formatCurrency(cp.net)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#EF5350]">Bills: {formatCurrency(cp.billTotal)}</span>
                  <span className="text-[#4DD0E1]">Balance: {formatCurrency(cp.runningBalance)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? 'font-semibold text-[#E0E0E0]' : 'text-[#90CAF9]'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${color}`}>{formatCurrency(value)}</span>
    </div>
  )
}
