import React from 'react'
import AuthLayout from './AuthLayout'
import { Link } from 'react-router-dom'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

function ForgotPassword() {
  return (
    <AuthLayout title="Forgot password" subtitle="Enter your institutional email to reset your password">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-heading-4">Lupa Kata Sandi</CardTitle>
          <CardDescription>Masukkan email institusi untuk mengatur ulang kata sandi.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fp-email" className="text-small text-foreground">Institutional Email</Label>
              <Input id="fp-email" name="email" type="email" placeholder="email@unila.ac.id" className="text-body-md" />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-black hover:opacity-70 text-body-md w-full">
                <span className="text-white">Send reset link</span>
              </Button>
            </div>

            <div className="mt-2 text-center">
              <Link to="/auth" className="text-primary hover:underline text-sm">Kembali ke Login</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default ForgotPassword
