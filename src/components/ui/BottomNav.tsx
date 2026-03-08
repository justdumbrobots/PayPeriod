import { Home, List, Receipt, Settings } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'

const tabs = [
  { id: 'home'     as const, label: 'Home',     Icon: Home    },
  { id: 'timeline' as const, label: 'Timeline', Icon: List    },
  { id: 'bills'    as const, label: 'Bills',    Icon: Receipt },
  { id: 'settings' as const, label: 'Settings', Icon: Settings },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useUIStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#162447] border-t border-[#1F4068] safe-bottom">
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex-1 flex flex-col items-center gap-1 py-3 px-2 no-select
                transition-colors active:scale-95 min-h-[56px]
                ${active ? 'text-[#64B5F6]' : 'text-[#4a6080]'}
              `}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? 'text-[#64B5F6]' : 'text-[#4a6080]'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
