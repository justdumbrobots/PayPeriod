import { useState } from 'react'
import { Plus, Edit2, Pause, Play, Trash2 } from 'lucide-react'
import { useBudgetStore } from '../stores/budgetStore'
import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'
import { Modal, ConfirmDialog } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { formatCurrency } from '../lib/format'
import { CATEGORY_META, BILL_FREQUENCY_LABELS } from '../types'
import type { Bill, BillFrequency, BillCategory, BillStatus } from '../types'

export function Bills() {
  const { bills, addBill, updateBill, removeBill } = useBudgetStore()
  const { user } = useAuthStore()
  const { showToast } = useUIStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [deletingBillId, setDeletingBillId] = useState<string | null>(null)

  const activeBills = bills.filter(b => b.status === 'active')
  const pausedBills = bills.filter(b => b.status === 'paused')
  const endedBills  = bills.filter(b => b.status === 'ended')

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill)
    setFormOpen(true)
  }

  const handleTogglePause = async (bill: Bill) => {
    const newStatus: BillStatus = bill.status === 'active' ? 'paused' : 'active'
    await updateBill({ ...bill, status: newStatus })
    showToast(newStatus === 'active' ? 'Bill activated' : 'Bill paused')
  }

  const handleDelete = async () => {
    if (!deletingBillId) return
    await removeBill(deletingBillId)
    setDeletingBillId(null)
    showToast('Bill deleted', 'success')
  }

  const handleSave = async (data: BillFormData) => {
    if (!user) return
    if (editingBill) {
      await updateBill({
        ...editingBill,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        dueDay: data.dueDay,
        category: data.category,
      })
      showToast('Bill updated', 'success')
    } else {
      await addBill(user.id, {
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        dueDay: data.dueDay,
        category: data.category,
        status: 'active',
      })
      showToast('Bill added', 'success')
    }
    setFormOpen(false)
    setEditingBill(null)
  }

  return (
    <div className="flex-1 overflow-y-auto pb-24 smooth-scroll safe-top">
      {/* Header */}
      <div className="bg-[#162447] px-5 pt-6 pb-4 border-b border-[#1F4068]">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-[#E0E0E0]">Bills Manager</h1>
          <button
            onClick={() => { setEditingBill(null); setFormOpen(true) }}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#64B5F6] text-[#1B1B2F] active:scale-95 transition-transform"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-[#90CAF9]">
          <span><span className="text-[#66BB6A] font-semibold">{activeBills.length}</span> Active</span>
          <span><span className="text-[#FFA726] font-semibold">{pausedBills.length}</span> Paused</span>
          <span><span className="text-[#4a6080] font-semibold">{endedBills.length}</span> Ended</span>
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-5">
        {bills.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-[#90CAF9] mb-4">No bills yet</p>
            <Button onClick={() => setFormOpen(true)}>Add Your First Bill</Button>
          </div>
        )}

        {activeBills.length > 0 && (
          <BillSection
            title="Active"
            bills={activeBills}
            onEdit={handleEdit}
            onTogglePause={handleTogglePause}
            onDelete={id => setDeletingBillId(id)}
          />
        )}
        {pausedBills.length > 0 && (
          <BillSection
            title="Paused"
            bills={pausedBills}
            onEdit={handleEdit}
            onTogglePause={handleTogglePause}
            onDelete={id => setDeletingBillId(id)}
            dimmed
          />
        )}
        {endedBills.length > 0 && (
          <BillSection
            title="Ended"
            bills={endedBills}
            onEdit={handleEdit}
            onTogglePause={handleTogglePause}
            onDelete={id => setDeletingBillId(id)}
            dimmed
          />
        )}
      </div>

      {/* Bill form modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingBill(null) }}
        title={editingBill ? 'Edit Bill' : 'Add Bill'}
      >
        <BillForm
          bill={editingBill}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditingBill(null) }}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingBillId}
        title="Delete Bill"
        message="This will permanently delete this bill and remove it from all future periods."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingBillId(null)}
        dangerous
      />
    </div>
  )
}

// ─── Bill Section ─────────────────────────────────────────────────────────────

interface BillSectionProps {
  title: string
  bills: Bill[]
  onEdit: (b: Bill) => void
  onTogglePause: (b: Bill) => void
  onDelete: (id: string) => void
  dimmed?: boolean
}

function BillSection({ title, bills, onEdit, onTogglePause, onDelete, dimmed }: BillSectionProps) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-[#90CAF9] uppercase tracking-wider mb-2">{title}</h2>
      <div className="flex flex-col gap-2">
        {bills.map(bill => (
          <BillRow
            key={bill.id}
            bill={bill}
            onEdit={() => onEdit(bill)}
            onTogglePause={() => onTogglePause(bill)}
            onDelete={() => onDelete(bill.id)}
            dimmed={dimmed}
          />
        ))}
      </div>
    </section>
  )
}

interface BillRowProps {
  bill: Bill
  onEdit: () => void
  onTogglePause: () => void
  onDelete: () => void
  dimmed?: boolean
}

function BillRow({ bill, onEdit, onTogglePause, onDelete, dimmed }: BillRowProps) {
  const catMeta = CATEGORY_META[bill.category]

  return (
    <div className={`bg-[#162447] rounded-xl overflow-hidden ${dimmed ? 'opacity-60' : ''}`}>
      <div className="flex items-center px-4 py-3 gap-3">
        {/* Category dot */}
        <div className="w-2.5 h-10 rounded-full flex-shrink-0" style={{ background: catMeta?.color ?? '#90A4AE' }} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#E0E0E0] truncate">{bill.name}</div>
          <div className="text-xs text-[#90CAF9]">
            {BILL_FREQUENCY_LABELS[bill.frequency]}
            {bill.dueDay && (bill.frequency === 'monthly' || bill.frequency === 'semi-monthly')
              ? ` · Due ${bill.dueDay}${ordSuffix(bill.dueDay)}`
              : ''}
          </div>
          <div className="text-xs text-[#4a6080]">{catMeta?.label}</div>
        </div>

        {/* Amount */}
        <div className="text-right mr-2">
          <div className="text-sm font-bold text-[#EF5350]">{formatCurrency(bill.amount)}</div>
          <div className="text-xs text-[#4a6080]">/ period</div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1F4068] text-[#64B5F6]"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={onTogglePause}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1F4068] text-[#FFA726]"
          >
            {bill.status === 'active' ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#EF5350]/10 text-[#EF5350]"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bill Form ────────────────────────────────────────────────────────────────

interface BillFormData {
  name: string
  amount: number
  frequency: BillFrequency
  dueDay: number | null
  category: BillCategory
}

interface BillFormProps {
  bill: Bill | null
  onSave: (data: BillFormData) => Promise<void>
  onCancel: () => void
}

function BillForm({ bill, onSave, onCancel }: BillFormProps) {
  const [name, setName] = useState(bill?.name ?? '')
  const [amount, setAmount] = useState(bill ? String(bill.amount) : '')
  const [frequency, setFrequency] = useState<BillFrequency>(bill?.frequency ?? 'monthly')
  const [dueDay, setDueDay] = useState(String(bill?.dueDay ?? 1))
  const [category, setCategory] = useState<BillCategory>(bill?.category ?? 'other')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!amount || parseFloat(amount) <= 0) errs.amount = 'Enter a valid amount'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setIsLoading(true)
    await onSave({
      name: name.trim(),
      amount: parseFloat(amount),
      frequency,
      dueDay: (frequency === 'monthly' || frequency === 'semi-monthly') ? parseInt(dueDay) : null,
      category,
    })
    setIsLoading(false)
  }

  const freqOptions = Object.entries(BILL_FREQUENCY_LABELS).map(([v, l]) => ({ value: v, label: l }))
  const categoryOptions = Object.entries(CATEGORY_META).map(([v, m]) => ({ value: v, label: m.label }))
  const dueDayOptions = Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}${ordSuffix(i + 1)}` }))

  return (
    <div className="px-5 pb-6 flex flex-col gap-4">
      <Input
        label="Bill Name"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. Rent, Electric, Netflix..."
        error={errors.name}
        maxLength={40}
      />
      <Input
        label="Amount"
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="0.00"
        prefix="$"
        step="0.01"
        error={errors.amount}
      />
      <Select
        label="Frequency"
        value={frequency}
        onChange={e => setFrequency(e.target.value as BillFrequency)}
        options={freqOptions}
      />
      {(frequency === 'monthly' || frequency === 'semi-monthly') && (
        <Select
          label="Due Day of Month"
          value={dueDay}
          onChange={e => setDueDay(e.target.value)}
          options={dueDayOptions}
        />
      )}
      <Select
        label="Category"
        value={category}
        onChange={e => setCategory(e.target.value as BillCategory)}
        options={categoryOptions}
      />
      <div className="flex gap-3 mt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button onClick={handleSave} loading={isLoading} className="flex-1">
          {bill ? 'Save Changes' : 'Add Bill'}
        </Button>
      </div>
    </div>
  )
}

function ordSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
