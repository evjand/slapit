'use client'
import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'

export function SignUpForm() {
  const { signIn } = useAuthActions()
  const [submitting, setSubmitting] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="gap-form-field flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitting(true)
            const formData = new FormData(e.target as HTMLFormElement)

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
                toast.error(toastTitle, {
                  description: (error as Error).message,
                })
                console.error(error)
                setSubmitting(false)
              })
          }}
        >
          <Input
            className="auth-input-field"
            type="email"
            name="email"
            placeholder="Email"
            required
          />
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
      </CardContent>
    </Card>
  )
}
