import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAuthStore } from './stores/authStore'
import { useBudgetStore } from './stores/budgetStore'
import { useUIStore } from './stores/uiStore'
import { AuthScreen } from './components/auth/AuthScreen'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { Dashboard } from './pages/Dashboard'
import { Timeline } from './pages/Timeline'
import { Bills } from './pages/Bills'
import { Settings } from './pages/Settings'
import { BottomNav } from './components/ui/BottomNav'
import { Toast } from './components/ui/Toast'
import { LoadingScreen } from './components/ui/LoadingScreen'

export default function App() {
  const { user, session, setSession, setInitialized, isInitialized } = useAuthStore()
  const { onboardingComplete, loadData, hasData } = useBudgetStore()
  const { activeTab } = useUIStore()

  // Initialize auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setInitialized(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setSession, setInitialized])

  // Load user data when authenticated
  useEffect(() => {
    if (user && !hasData) {
      loadData(user.id)
    }
  }, [user, hasData, loadData])

  if (!isInitialized) {
    return <LoadingScreen message="Initializing..." />
  }

  if (!session) {
    return (
      <>
        <AuthScreen />
        <Toast />
      </>
    )
  }

  if (!onboardingComplete && !hasData) {
    return (
      <>
        <OnboardingFlow />
        <Toast />
      </>
    )
  }

  return (
    <div className="flex flex-col h-dvh bg-[#1B1B2F] overflow-hidden">
      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'home'     && <Dashboard />}
        {activeTab === 'timeline' && <Timeline />}
        {activeTab === 'bills'    && <Bills />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Bottom navigation */}
      <BottomNav />

      {/* Global toast */}
      <Toast />
    </div>
  )
}
