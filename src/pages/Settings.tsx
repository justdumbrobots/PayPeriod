import { useState } from 'react'
import {
  User, Calendar, DollarSign, Bell, Download, Moon, LogOut,
  Trash2, ChevronRight, Shield,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { CalendarPicker } from '../components/ui/CalendarPicker'
import { Modal, ConfirmDialog } from '../components/ui/Modal'
import { useAuthStore } from '../stores/authStore'
import { useBudgetStore } from '../stores/budgetStore'
import { useUIStore } from '../stores/uiStore'
import { formatCurrency } from '../lib/format'
import { PAY_FREQUENCY_LABELS } from '../types'
import type { PayFrequency } from '../types'

export function Settings() {
  const { user, signOut } = useAuthStore()
  const { profile, saveProfile, bills, extraItems, reset } = useBudgetStore()
  const { showToast } = useUIStore()

  const [editScheduleOpen, setEditScheduleOpen] = useState(false)
  const [editIncomeOpen, setEditIncomeOpen] = useState(false)
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Schedule form state
  const [payFrequency, setPayFrequency] = useState<PayFrequency>(profile?.payFrequency ?? 'bi-weekly')
  const [anchorPayDate, setAnchorPayDate] = useState(profile?.anchorPayDate ?? '')

  // Income form state
  const [incomePerPeriod, setIncomePerPeriod] = useState(String(profile?.incomePerPeriod ?? ''))
  const [sideIncome, setSideIncome] = useState(String(profile?.sideIncome ?? '0'))

  const freqOptions = Object.entries(PAY_FREQUENCY_LABELS).map(([v, l]) => ({ value: v, label: l }))

  const handleSaveSchedule = async () => {
    if (!user || !anchorPayDate) return
    await saveProfile(user.id, { payFrequency, anchorPayDate })
    showToast('Pay schedule updated', 'success')
    setEditScheduleOpen(false)
  }

  const handleSaveIncome = async () => {
    if (!user) return
    const income = parseFloat(incomePerPeriod)
    if (isNaN(income) || income <= 0) {
      showToast('Enter a valid income amount', 'error')
      return
    }
    await saveProfile(user.id, {
      incomePerPeriod: income,
      sideIncome: parseFloat(sideIncome) || 0,
    })
    showToast('Income updated', 'success')
    setEditIncomeOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    reset()
  }

  const handleExportCSV = () => {
    if (!profile) return
    const rows = [
      ['Period Index', 'Pay Date', 'Income', 'Bills Total', 'Extras Total', 'Net', 'Running Balance'],
    ]
    // Simple export from bills data
    const csvContent = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'payperiod-export.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Export started', 'success')
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 smooth-scroll safe-top">
      {/* Header */}
      <div className="bg-[#162447] px-5 pt-6 pb-5 border-b border-[#1F4068]">
        <h1 className="text-lg font-bold text-[#E0E0E0]">Settings</h1>
        {user && (
          <p className="text-sm text-[#90CAF9] mt-1">{user.email}</p>
        )}
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Account */}
        <Section title="Account">
          <SettingRow
            icon={<User size={18} />}
            label="Email"
            value={user?.email ?? '—'}
          />
          <SettingRow
            icon={<Shield size={18} />}
            label="Account Security"
            value="Password + OAuth"
          />
        </Section>

        {/* Pay setup */}
        <Section title="Pay Setup">
          <SettingRow
            icon={<Calendar size={18} />}
            label="Pay Schedule"
            value={profile ? `${PAY_FREQUENCY_LABELS[profile.payFrequency].split(' (')[0]} · ${profile.anchorPayDate}` : '—'}
            onTap={() => setEditScheduleOpen(true)}
          />
          <SettingRow
            icon={<DollarSign size={18} />}
            label="Income Per Paycheck"
            value={profile ? formatCurrency(profile.incomePerPeriod) : '—'}
            onTap={() => setEditIncomeOpen(true)}
          />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <SettingRow
            icon={<Moon size={18} />}
            label="Theme"
            value="Dark (default)"
          />
          <SettingRow
            icon={<Bell size={18} />}
            label="Notifications"
            value="Coming in v1.1"
          />
        </Section>

        {/* Data */}
        <Section title="Data">
          <SettingRow
            icon={<Download size={18} />}
            label="Export to CSV"
            value={`${bills.length} bills, ${extraItems.length} extras`}
            onTap={handleExportCSV}
          />
        </Section>

        {/* Sign out & delete */}
        <Section title="Account Actions">
          <button
            onClick={() => setSignOutConfirmOpen(true)}
            className="w-full flex items-center gap-4 py-4 px-1"
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FFA726]/10 text-[#FFA726]">
              <LogOut size={18} />
            </div>
            <span className="text-sm font-medium text-[#FFA726]">Sign Out</span>
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="w-full flex items-center gap-4 py-4 px-1"
          >
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#EF5350]/10 text-[#EF5350]">
              <Trash2 size={18} />
            </div>
            <span className="text-sm font-medium text-[#EF5350]">Delete Account</span>
          </button>
        </Section>

        <p className="text-center text-xs text-[#4a6080] pb-4">
          PayPeriod v1.0.0 · Built for bi-weekly budgeters
        </p>
      </div>

      {/* Edit Schedule Modal */}
      <Modal open={editScheduleOpen} onClose={() => setEditScheduleOpen(false)} title="Edit Pay Schedule">
        <div className="px-5 pb-6 flex flex-col gap-4">
          <Select
            label="Pay Frequency"
            value={payFrequency}
            onChange={e => setPayFrequency(e.target.value as PayFrequency)}
            options={freqOptions}
          />
          <CalendarPicker
            label="Anchor Pay Date"
            value={anchorPayDate}
            onChange={setAnchorPayDate}
          />
          <p className="text-xs text-[#FFA726]">
            ⚠ Changing your pay schedule regenerates all pay period dates.
          </p>
          <Button fullWidth onClick={handleSaveSchedule}>Save Schedule</Button>
        </div>
      </Modal>

      {/* Edit Income Modal */}
      <Modal open={editIncomeOpen} onClose={() => setEditIncomeOpen(false)} title="Edit Income">
        <div className="px-5 pb-6 flex flex-col gap-4">
          <Input
            label="Take-Home Pay Per Paycheck"
            type="number"
            value={incomePerPeriod}
            onChange={e => setIncomePerPeriod(e.target.value)}
            prefix="$"
            step="0.01"
            autoFocus
          />
          <Input
            label="Side Income Per Period"
            type="number"
            value={sideIncome}
            onChange={e => setSideIncome(e.target.value)}
            prefix="$"
            step="0.01"
          />
          <Button fullWidth onClick={handleSaveIncome}>Save Income</Button>
        </div>
      </Modal>

      {/* Confirmations */}
      <ConfirmDialog
        open={signOutConfirmOpen}
        title="Sign Out"
        message="You'll need to sign in again to access your budget."
        confirmLabel="Sign Out"
        onConfirm={handleSignOut}
        onCancel={() => setSignOutConfirmOpen(false)}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Account"
        message="This permanently deletes your account and all data. This cannot be undone."
        confirmLabel="Delete Account"
        onConfirm={() => {
          // TODO: implement full account deletion via Supabase
          showToast('Please contact support to delete your account', 'info')
          setDeleteConfirmOpen(false)
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
        dangerous
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#162447] rounded-2xl overflow-hidden">
      <div className="px-4 py-2 border-b border-[#1F4068]">
        <span className="text-xs font-semibold text-[#90CAF9] uppercase tracking-wider">{title}</span>
      </div>
      <div className="divide-y divide-[#1F4068]/50">
        {children}
      </div>
    </div>
  )
}

interface SettingRowProps {
  icon: React.ReactNode
  label: string
  value?: string
  onTap?: () => void
}

function SettingRow({ icon, label, value, onTap }: SettingRowProps) {
  const inner = (
    <div className="flex items-center gap-4 py-4 px-4">
      <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#1F4068] text-[#64B5F6] flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[#E0E0E0]">{label}</div>
        {value && <div className="text-xs text-[#90CAF9] truncate">{value}</div>}
      </div>
      {onTap && <ChevronRight size={16} className="text-[#4a6080]" />}
    </div>
  )

  if (onTap) {
    return (
      <button onClick={onTap} className="w-full text-left active:bg-[#1F4068]/30 transition-colors">
        {inner}
      </button>
    )
  }
  return <div>{inner}</div>
}
