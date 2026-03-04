import { AuthCard } from '@/components/auth/auth-card'

export default function VerifyEmailPage() {
  return (
    <AuthCard>
      <div className="text-center">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-blue-50">
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Check your inbox</h1>
        <p className="text-gray-500 text-sm mb-6">
          We sent a verification link to your email. Click the link to confirm your account and
          continue.
        </p>

        <p className="text-gray-400 text-xs">
          Didn&apos;t receive it? Check your spam folder. If you continue to have issues, contact
          support.
        </p>
      </div>
    </AuthCard>
  )
}
