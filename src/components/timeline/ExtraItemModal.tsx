import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input, Select } from '../ui/Input'
import { useBudgetStore } from '../../stores/budgetStore'
import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { CATEGORY_META } from '../../types'
import type { BillCategory } from '../../types'

interface Props {
  periodIndex: number
}

export function ExtraItemModal({ periodIndex }: Props) {
  const { extraModalOpen, closeExtraModal, showToast } = useUIStore()
  const { addExtraItem, computedPeriods } = useBudgetStore()
  const { user } = useAuthStore()

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [isExpense, setIsExpense] = useState(true)
  const [category, setCategory] = useState<BillCategory | ''>('')
  const [isLoading, setIsLoading] = useState(false)

  const cp = computedPeriods[periodIndex]
  const categoryOptions = [
    { value: '', label: 'No category' },
    ...Object.entries(CATEGORY_META).map(([v, m]) => ({ value: v, label: m.label })),
  ]

  const handleSave = async () => {
    if (!user || !amount) return
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return

    setIsLoading(true)
    await addExtraItem(user.id, {
      periodIndex,
      amount: isExpense ? numAmount : -numAmount,
      note: note.trim() || null,
      category: category || null,
    })
    showToast('Item added', 'success')
    closeExtraModal()
  }

  return (
    <Modal open={extraModalOpen} onClose={closeExtraModal} title="Add One-Time Item">
      <div className="px-5 pb-6 flex flex-col gap-4">
        {cp && (
          <p className="text-sm text-[#90CAF9]">
            Adding to period: <span className="text-[#E0E0E0] font-medium">{cp.period.payDateStr}</span>
          </p>
        )}

        {/* Expense / Credit toggle */}
        <div className="flex bg-[#0D2137] rounded-xl p-1">
          <button
            onClick={() => setIsExpense(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isExpense ? 'bg-[#EF5350]/80 text-white' : 'text-[#90CAF9]'
            }`}
          >
            Expense (+)
          </button>
          <button
            onClick={() => setIsExpense(false)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              !isExpense ? 'bg-[#66BB6A]/80 text-white' : 'text-[#90CAF9]'
            }`}
          >
            Credit (−)
          </button>
        </div>

        <Input
          label="Amount"
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          prefix="$"
          step="0.01"
          autoFocus
        />

        <Input
          label="Note (optional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="e.g. Car repair, bonus check..."
          maxLength={100}
        />

        <Select
          label="Category (optional)"
          value={category}
          onChange={e => setCategory(e.target.value as BillCategory | '')}
          options={categoryOptions}
        />

        <Button
          fullWidth
          size="lg"
          onClick={handleSave}
          loading={isLoading}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          Add Item
        </Button>
      </div>
    </Modal>
  )
}
