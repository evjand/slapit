'use client'
import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'

export function SignInForm() {
  const { signIn } = useAuthActions()
  const [submitting, setSubmitting] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="gap-form-field flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitting(true)
            const formData = new FormData(e.target as HTMLFormElement)
            formData.set('flow', 'signIn')
            void signIn('password', formData).catch((error) => {
              let toastTitle = ''
              if (error.message.includes('Invalid password')) {
                toastTitle = 'Invalid password. Please try again.'
              } else {
                toastTitle = 'Could not sign in. Please check your credentials.'
              }
              toast.error(toastTitle)
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
            required
          />
          <Button type="submit" disabled={submitting}>
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
