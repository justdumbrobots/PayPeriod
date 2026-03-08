import { useState } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronRight, ChevronLeft, Plus, X, Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Input'
import { CalendarPicker } from '../ui/CalendarPicker'
import { useAuthStore } from '../../stores/authStore'
import { useBudgetStore } from '../../stores/budgetStore'
import { useUIStore } from '../../stores/uiStore'
import { formatCurrency } from '../../lib/format'
import { generatePayPeriods, computeAllPeriods } from '../../lib/billEngine'
import {
  QUICK_ADD_BILLS, PAY_FREQUENCY_LABELS, BILL_FREQUENCY_LABELS, CATEGORY_META,
  type PayFrequency, type BillFrequency, type BillCategory,
} from '../../types'

const scheduleSchema = z.object({
  payFrequency: z.enum(['bi-weekly', 'weekly', 'semi-monthly', 'monthly']),
  anchorPayDate: z.string().min(1, 'Select your next pay date'),
})

const incomeSchema = z.object({
  incomePerPeriod: z.string().min(1).transform(v => parseFloat(v)).refine(v => v > 0, 'Enter your take-home pay'),
  sideIncome: z.string().optional().transform(v => parseFloat(v || '0') || 0),
})

type ScheduleForm = z.infer<typeof scheduleSchema>
type IncomeForm = z.infer<typeof incomeSchema>

interface DraftBill {
  name: string
  amount: number
  frequency: BillFrequency
  dueDay: number | null
  category: BillCategory
}

export function OnboardingFlow() {
  const [step, setStep] = useState(1)
  const [schedule, setSchedule] = useState<ScheduleForm | null>(null)
  const [income, setIncome] = useState<IncomeForm | null>(null)
  const [bills, setBills] = useState<DraftBill[]>([])
  const [addingBill, setAddingBill] = useState(false)

  const { user } = useAuthStore()
  const { saveProfile, addBill, setOnboardingComplete } = useBudgetStore()
  const { showToast } = useUIStore()

  const scheduleForm = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: { payFrequency: 'bi-weekly' },
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incomeForm = useForm<any>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { sideIncome: '0' },
  })

  const handleSchedule = (data: ScheduleForm) => {
    setSchedule(data)
    setStep(2)
  }

  const handleIncome = (data: IncomeForm) => {
    setIncome(data)
    setStep(3)
  }

  const handleFinish = async () => {
    if (!user || !schedule || !income) return
    try {
      await saveProfile(user.id, {
        payFrequency: schedule.payFrequency as PayFrequency,
        anchorPayDate: schedule.anchorPayDate,
        incomePerPeriod: income.incomePerPeriod,
        sideIncome: income.sideIncome || 0,
      })
      for (const bill of bills) {
        await addBill(user.id, { ...bill, status: 'active' })
      }
      setOnboardingComplete(true)
      showToast('Welcome to PayPeriod!', 'success')
    } catch {
      showToast('Setup failed. Please try again.', 'error')
    }
  }

  const totalSteps = 4

  return (
    <div className="min-h-dvh bg-[#1B1B2F] flex flex-col safe-top">
      {/* Progress bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-2">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="text-[#64B5F6] mr-1">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex-1">
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    i + 1 <= step ? 'bg-[#64B5F6]' : 'bg-[#1F4068]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <p className="text-xs text-[#90CAF9]">Step {step} of {totalSteps}</p>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 overflow-y-auto pb-8">
        {step === 1 && <StepSchedule form={scheduleForm} onSubmit={handleSchedule} />}
        {step === 2 && <StepIncome form={incomeForm} schedule={schedule!} onSubmit={handleIncome} />}
        {step === 3 && (
          <StepBills
            bills={bills}
            onAddBill={b => setBills(prev => [...prev, b])}
            onRemoveBill={i => setBills(prev => prev.filter((_, idx) => idx !== i))}
            onNext={() => setStep(4)}
            addingBill={addingBill}
            setAddingBill={setAddingBill}
          />
        )}
        {step === 4 && (
          <StepReview
            schedule={schedule!}
            income={income!}
            bills={bills}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  )
}

// ─── Step 1: Pay Schedule ─────────────────────────────────────────────────────

function StepSchedule({ form, onSubmit }: { form: UseFormReturn<ScheduleForm>, onSubmit: (d: ScheduleForm) => void }) {
  const freqOptions = Object.entries(PAY_FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))
  return (
    <div className="fade-in">
      <h2 className="text-2xl font-bold text-[#E0E0E0] mb-2">Pay Schedule</h2>
      <p className="text-[#90CAF9] text-sm mb-6">Tell us when you get paid so we can build your forecast.</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Select
          label="Pay Frequency"
          options={freqOptions}
          error={form.formState.errors.payFrequency?.message}
          {...form.register('payFrequency')}
        />
        <CalendarPicker
          label="Next Pay Date"
          value={form.watch('anchorPayDate') || ''}
          onChange={v => form.setValue('anchorPayDate', v)}
          error={form.formState.errors.anchorPayDate?.message}
          minDate={new Date()}
        />
        <Button type="submit" fullWidth size="lg" className="mt-2">
          Continue <ChevronRight size={18} className="ml-1" />
        </Button>
      </form>
    </div>
  )
}

// ─── Step 2: Income ───────────────────────────────────────────────────────────

function StepIncome({
  form, schedule, onSubmit,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>,
  schedule: ScheduleForm,
  onSubmit: (d: IncomeForm) => void,
}) {
  return (
    <div className="fade-in">
      <h2 className="text-2xl font-bold text-[#E0E0E0] mb-2">Your Income</h2>
      <p className="text-[#90CAF9] text-sm mb-6">
        Enter your take-home pay per {schedule.payFrequency === 'bi-weekly' ? 'bi-weekly paycheck' : 'paycheck'} after taxes.
      </p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Input
          label="Take-Home Pay Per Paycheck"
          type="number"
          placeholder="2500.00"
          prefix="$"
          step="0.01"
          error={form.formState.errors.incomePerPeriod?.message as string | undefined}
          {...form.register('incomePerPeriod')}
        />
        <Input
          label="Additional Income Per Period (optional)"
          type="number"
          placeholder="0.00"
          prefix="$"
          step="0.01"
          error={form.formState.errors.sideIncome?.message as string | undefined}
          {...form.register('sideIncome')}
        />
        <p className="text-xs text-[#4a6080]">
          Side income, freelance, tips, etc. Leave at $0 if none.
        </p>
        <Button type="submit" fullWidth size="lg">
          Continue <ChevronRight size={18} className="ml-1" />
        </Button>
      </form>
    </div>
  )
}

// ─── Step 3: Bills ────────────────────────────────────────────────────────────

function StepBills({
  bills, onAddBill, onRemoveBill, onNext, addingBill, setAddingBill,
}: {
  bills: DraftBill[]
  onAddBill: (b: DraftBill) => void
  onRemoveBill: (i: number) => void
  onNext: () => void
  addingBill: boolean
  setAddingBill: (v: boolean) => void
}) {
  return (
    <div className="fade-in">
      <h2 className="text-2xl font-bold text-[#E0E0E0] mb-2">Your Bills</h2>
      <p className="text-[#90CAF9] text-sm mb-4">Add your recurring bills. You can add more anytime.</p>

      {/* Quick add carousel */}
      {!addingBill && (
        <div className="mb-5">
          <p className="text-xs text-[#90CAF9] mb-2 font-medium">QUICK ADD</p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {QUICK_ADD_BILLS.map(qb => {
              const already = bills.some(b => b.name === qb.name)
              return (
                <button
                  key={qb.name}
                  onClick={() => !already && onAddBill({ name: qb.name, amount: 0, frequency: qb.frequency, dueDay: qb.dueDay, category: qb.category })}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    already
                      ? 'border-[#66BB6A] bg-[#66BB6A]/10 text-[#66BB6A]'
                      : 'border-[#64B5F6] bg-[#64B5F6]/10 text-[#64B5F6] active:scale-95'
                  }`}
                >
                  {already ? <Check size={12} className="inline mr-1" /> : null}
                  {qb.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Bill list */}
      <div className="flex flex-col gap-2 mb-4">
        {bills.map((bill, i) => (
          <div key={i} className="flex items-center justify-between bg-[#162447] rounded-xl px-4 py-3">
            <div>
              <div className="text-sm font-medium text-[#E0E0E0]">{bill.name}</div>
              <div className="text-xs text-[#90CAF9]">
                {BILL_FREQUENCY_LABELS[bill.frequency]}
                {bill.dueDay ? ` · Due ${bill.dueDay}${ordSuffix(bill.dueDay)}` : ''}
                {bill.amount > 0 ? ` · ${formatCurrency(bill.amount)}` : ' · $0 (edit later)'}
              </div>
            </div>
            <button onClick={() => onRemoveBill(i)} className="w-8 h-8 flex items-center justify-center text-[#EF5350] hover:bg-[#EF5350]/10 rounded-full">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Add bill form */}
      {addingBill
        ? <AddBillForm onAdd={b => { onAddBill(b); setAddingBill(false) }} onCancel={() => setAddingBill(false)} />
        : (
          <button
            onClick={() => setAddingBill(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#1F4068] text-[#64B5F6] text-sm font-medium mb-6 hover:border-[#64B5F6] transition-colors"
          >
            <Plus size={16} /> Add Bill
          </button>
        )
      }

      {!addingBill && (
        <Button fullWidth size="lg" onClick={onNext}>
          {bills.length === 0 ? 'Skip for Now' : 'Continue'} <ChevronRight size={18} className="ml-1" />
        </Button>
      )}
    </div>
  )
}

function AddBillForm({ onAdd, onCancel }: { onAdd: (b: DraftBill) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<BillFrequency>('monthly')
  const [dueDay, setDueDay] = useState('1')
  const [category, setCategory] = useState<BillCategory>('other')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      amount: parseFloat(amount) || 0,
      frequency,
      dueDay: frequency === 'monthly' || frequency === 'semi-monthly' ? parseInt(dueDay) : null,
      category,
    })
  }

  const freqOptions = Object.entries(BILL_FREQUENCY_LABELS).map(([value, label]) => ({ value, label }))
  const categoryOptions = Object.entries(CATEGORY_META).map(([value, meta]) => ({ value, label: meta.label }))
  const dueDayOptions = Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}${ordSuffix(i + 1)}` }))

  return (
    <div className="bg-[#0D2137] rounded-2xl p-4 mb-4 flex flex-col gap-3">
      <Input label="Bill Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rent" />
      <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} prefix="$" placeholder="0.00" step="0.01" />
      <Select label="Frequency" value={frequency} onChange={e => setFrequency(e.target.value as BillFrequency)} options={freqOptions} />
      {(frequency === 'monthly' || frequency === 'semi-monthly') && (
        <Select label="Due Day of Month" value={dueDay} onChange={e => setDueDay(e.target.value)} options={dueDayOptions} />
      )}
      <Select label="Category" value={category} onChange={e => setCategory(e.target.value as BillCategory)} options={categoryOptions} />
      <div className="flex gap-2 mt-1">
        <Button variant="ghost" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button onClick={handleAdd} className="flex-1" disabled={!name.trim()}>Add Bill</Button>
      </div>
    </div>
  )
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function StepReview({
  schedule, income, bills, onFinish,
}: {
  schedule: ScheduleForm
  income: IncomeForm
  bills: DraftBill[]
  onFinish: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  // Preview first 4 periods
  const periods = generatePayPeriods(schedule.anchorPayDate, schedule.payFrequency as PayFrequency, 4)
  const mappedBills = bills.map((b, i) => ({
    id: String(i), userId: '', name: b.name, amount: b.amount,
    frequency: b.frequency, dueDay: b.dueDay, category: b.category,
    status: 'active' as const, sortOrder: i, createdAt: '',
  }))
  const preview = computeAllPeriods(periods, mappedBills, [], income.incomePerPeriod, income.sideIncome || 0)

  const handleFinish = async () => {
    setIsLoading(true)
    await onFinish()
  }

  return (
    <div className="fade-in">
      <h2 className="text-2xl font-bold text-[#E0E0E0] mb-2">Preview Your Budget</h2>
      <p className="text-[#90CAF9] text-sm mb-5">Your first 4 pay periods — does this look right?</p>

      <div className="flex flex-col gap-3 mb-8">
        {preview.map(cp => (
          <div key={cp.period.index} className="bg-[#162447] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#90CAF9]">{cp.period.payDateStr}</span>
              <span className={`text-sm font-bold ${cp.net >= 0 ? 'text-[#FFD740]' : 'text-[#EF5350]'}`}>
                Net: {formatCurrency(cp.net)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#66BB6A]">Income: {formatCurrency(cp.income)}</span>
              <span className="text-[#EF5350]">Bills: {formatCurrency(cp.billTotal)}</span>
              <span className="text-[#4DD0E1]">Bal: {formatCurrency(cp.runningBalance)}</span>
            </div>
            {cp.billAssignments.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[#1F4068]">
                {cp.billAssignments.map(({ bill }) => (
                  <div key={bill.id} className="flex justify-between text-xs text-[#90CAF9] py-0.5">
                    <span>{bill.name}</span>
                    <span className="text-[#EF5350]">{formatCurrency(bill.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button fullWidth size="lg" onClick={handleFinish} loading={isLoading}>
        Start Budgeting! <ChevronRight size={18} className="ml-1" />
      </Button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ordSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
