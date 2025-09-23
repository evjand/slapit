'use client'
import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'
import { toast } from 'sonner'

export function SignUpForm() {
  const { signIn } = useAuthActions()
  const [submitting, setSubmitting] = useState(false)

  // Hardcoded allowed email - change this to your desired email
  const ALLOWED_EMAIL = 'login@slapit.no'

  return (
    <div className="w-full">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitting(true)
          const formData = new FormData(e.target as HTMLFormElement)
          const email = formData.get('email') as string
          console.log('formData', formData)

          // Check if email is allowed
          if (email !== ALLOWED_EMAIL) {
            toast.error(
              `Registration is restricted. Only ${ALLOWED_EMAIL} can create an account. You tried to use ${email}.`
            )
            setSubmitting(false)
            return
          }

          formData.set('flow', 'signUp')
          void signIn('password', formData)
            .then(() => {
              toast.success('Account created successfully!')
            })
            .catch((error) => {
              let toastTitle = ''
              if (error.message.includes('already exists')) {
                toastTitle = 'Account already exists. Try signing in instead.'
              } else {
                toastTitle = 'Could not create account. Please try again.'
              }
              toast.error(toastTitle)
              setSubmitting(false)
            })
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          defaultValue={ALLOWED_EMAIL}
          readOnly
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          minLength={6}
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          Create Account
        </button>
      </form>
    </div>
  )
}
