import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, DollarSign } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useUIStore } from '../../stores/uiStore'
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signInWithApple, resetPassword } from '../../lib/supabase'

const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const signUpSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type SignInForm = z.infer<typeof signInSchema>
type SignUpForm = z.infer<typeof signUpSchema>
type Mode = 'signin' | 'signup' | 'forgot' | 'check-email'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useUIStore()

  const signInForm = useForm<SignInForm>({ resolver: zodResolver(signInSchema) })
  const signUpForm = useForm<SignUpForm>({ resolver: zodResolver(signUpSchema) })

  const handleSignIn = async (data: SignInForm) => {
    setIsLoading(true)
    const { error } = await signInWithEmail(data.email, data.password)
    if (error) {
      showToast(error.message, 'error')
    }
    setIsLoading(false)
  }

  const handleSignUp = async (data: SignUpForm) => {
    setIsLoading(true)
    const { error } = await signUpWithEmail(data.email, data.password)
    if (error) {
      showToast(error.message, 'error')
    } else {
      setMode('check-email')
    }
    setIsLoading(false)
  }

  const handleForgot = async (data: SignInForm) => {
    setIsLoading(true)
    const { error } = await resetPassword(data.email)
    if (error) {
      showToast(error.message, 'error')
    } else {
      showToast('Password reset email sent', 'success')
      setMode('signin')
    }
    setIsLoading(false)
  }

  const handleGoogle = async () => {
    setIsLoading(true)
    const { error } = await signInWithGoogle()
    if (error) showToast(error.message, 'error')
    setIsLoading(false)
  }

  const handleApple = async () => {
    setIsLoading(true)
    const { error } = await signInWithApple()
    if (error) showToast(error.message, 'error')
    setIsLoading(false)
  }

  if (mode === 'check-email') {
    return (
      <div className="min-h-dvh bg-[#1B1B2F] flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#64B5F6]/20 flex items-center justify-center mx-auto mb-6">
            <Mail size={32} className="text-[#64B5F6]" />
          </div>
          <h2 className="text-2xl font-bold text-[#E0E0E0] mb-3">Check your email</h2>
          <p className="text-[#90CAF9] mb-8">
            We sent a verification link to your email. Click it to activate your account.
          </p>
          <Button variant="outline" fullWidth onClick={() => setMode('signin')}>
            Back to Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#1B1B2F] flex flex-col safe-top">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="w-16 h-16 rounded-2xl bg-[#64B5F6] flex items-center justify-center mb-4 shadow-lg shadow-[#64B5F6]/20">
          <DollarSign size={32} className="text-[#1B1B2F]" />
        </div>
        <h1 className="text-3xl font-bold text-[#E0E0E0]">PayPeriod</h1>
        <p className="text-[#90CAF9] text-sm mt-1">Your bi-weekly budget tracker</p>
      </div>

      {/* Form card */}
      <div className="flex-1 bg-[#162447] rounded-t-3xl px-6 pt-8 pb-8">
        {/* Tab switcher */}
        {mode !== 'forgot' && (
          <div className="flex bg-[#0D2137] rounded-xl p-1 mb-8">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-[#64B5F6] text-[#1B1B2F]'
                  : 'text-[#90CAF9]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-[#64B5F6] text-[#1B1B2F]'
                  : 'text-[#90CAF9]'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              error={signInForm.formState.errors.email?.message}
              {...signInForm.register('email')}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                error={signInForm.formState.errors.password?.message}
                {...signInForm.register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-[#90CAF9] hover:text-[#64B5F6]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMode('forgot')}
              className="text-sm text-[#64B5F6] text-left hover:underline"
            >
              Forgot password?
            </button>
            <Button type="submit" fullWidth loading={isLoading} size="lg">
              Sign In
            </Button>
          </form>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              autoComplete="email"
              error={signUpForm.formState.errors.email?.message}
              {...signUpForm.register('email')}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 chars, 1 number"
                autoComplete="new-password"
                error={signUpForm.formState.errors.password?.message}
                {...signUpForm.register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-[#90CAF9] hover:text-[#64B5F6]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              error={signUpForm.formState.errors.confirmPassword?.message}
              {...signUpForm.register('confirmPassword')}
            />
            <Button type="submit" fullWidth loading={isLoading} size="lg">
              Create Account
            </Button>
          </form>
        )}

        {/* Forgot Password */}
        {mode === 'forgot' && (
          <div>
            <button
              onClick={() => setMode('signin')}
              className="text-[#64B5F6] text-sm mb-6 flex items-center gap-1"
            >
              ← Back to Sign In
            </button>
            <h2 className="text-xl font-semibold text-[#E0E0E0] mb-2">Reset Password</h2>
            <p className="text-[#90CAF9] text-sm mb-6">We'll send a reset link to your email.</p>
            <form onSubmit={signInForm.handleSubmit(handleForgot)} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                error={signInForm.formState.errors.email?.message}
                {...signInForm.register('email')}
              />
              <Button type="submit" fullWidth loading={isLoading}>
                Send Reset Link
              </Button>
            </form>
          </div>
        )}

        {/* Divider */}
        {mode !== 'forgot' && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#1F4068]" />
              <span className="text-xs text-[#4a6080]">or continue with</span>
              <div className="flex-1 h-px bg-[#1F4068]" />
            </div>

            {/* Social sign-in */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoogle}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#1F4068] bg-[#0D2137] text-[#E0E0E0] text-sm font-medium hover:border-[#64B5F6] transition-colors active:scale-95 min-h-[44px]"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <button
                onClick={handleApple}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[#1F4068] bg-[#0D2137] text-[#E0E0E0] text-sm font-medium hover:border-[#64B5F6] transition-colors active:scale-95 min-h-[44px]"
              >
                <AppleIcon />
                Continue with Apple
              </button>
            </div>
          </>
        )}

        <p className="text-xs text-center text-[#4a6080] mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  )
}
