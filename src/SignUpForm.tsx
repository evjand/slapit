'use client'
import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'

export function SignUpForm() {
  const { signIn } = useAuthActions()
  const [submitting, setSubmitting] = useState(false)

  // Hardcoded allowed email - change this to your desired email
  const ALLOWED_EMAIL = 'login@slapit.no'

  return (
    <div className="w-full">
      <form
        className="gap-form-field flex flex-col"
        onSubmit={(e) => {
          e.preventDefault()
          setSubmitting(true)
          const formData = new FormData(e.target as HTMLFormElement)
          formData.set('email', ALLOWED_EMAIL)
          const email = formData.get('email') as string
          console.log('formData', formData)

          // Check if email is allowed
          if (email !== ALLOWED_EMAIL) {
            toast.error(
              `Registration is restricted. Only ${ALLOWED_EMAIL} can create an account. You tried to use ${email}.`,
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
              toast.error(toastTitle, { description: (error as Error).message })
              setSubmitting(false)
            })
        }}
      >
        <Input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          minLength={6}
          required
        />
        <Button className="auth-button" type="submit" disabled={submitting}>
          Create Account
        </Button>
      </form>
    </div>
  )
}
