import { create } from 'zustand'

interface UIStore {
  // Navigation
  activeTab: 'home' | 'timeline' | 'bills' | 'settings'
  setActiveTab: (tab: 'home' | 'timeline' | 'bills' | 'settings') => void

  // Modal states
  extraModalOpen: boolean
  extraModalPeriodIndex: number | null
  openExtraModal: (periodIndex: number) => void
  closeExtraModal: () => void

  billFormOpen: boolean
  editingBillId: string | null
  openBillForm: (billId?: string) => void
  closeBillForm: () => void

  // Period detail
  selectedPeriodIndex: number | null
  setSelectedPeriod: (index: number | null) => void

  // Toast notifications
  toast: { message: string; type: 'success' | 'error' | 'info' } | null
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  clearToast: () => void

  // Timeline scroll position memory
  timelineScrollIndex: number
  setTimelineScrollIndex: (index: number) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'home',
  setActiveTab: (activeTab) => set({ activeTab }),

  extraModalOpen: false,
  extraModalPeriodIndex: null,
  openExtraModal: (periodIndex) => set({ extraModalOpen: true, extraModalPeriodIndex: periodIndex }),
  closeExtraModal: () => set({ extraModalOpen: false, extraModalPeriodIndex: null }),

  billFormOpen: false,
  editingBillId: null,
  openBillForm: (billId) => set({ billFormOpen: true, editingBillId: billId ?? null }),
  closeBillForm: () => set({ billFormOpen: false, editingBillId: null }),

  selectedPeriodIndex: null,
  setSelectedPeriod: (selectedPeriodIndex) => set({ selectedPeriodIndex }),

  toast: null,
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } })
    setTimeout(() => set({ toast: null }), 3500)
  },
  clearToast: () => set({ toast: null }),

  timelineScrollIndex: 0,
  setTimelineScrollIndex: (timelineScrollIndex) => set({ timelineScrollIndex }),
}))
