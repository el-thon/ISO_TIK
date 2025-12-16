import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
      <div className="flex flex-col items-center gap-6 w-full">


        <div className="text-center">
          <h1 className="text-heading-3 font-semibold text-navy">Sistem Internal TIK</h1>
          <p className="text-body-md text-muted-foreground">Universitas</p>
        </div>

  <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-heading-3 font-semibold ">Sign In</CardTitle>
            <CardDescription className="text-center text-body-md text-muted-foreground">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-small text-foreground">Email Institusi</Label>
                <Input id="email" name="email" type="email" placeholder="email@unila.ac.id" className="text-body-md" />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-small text-foreground">Kata Sandi</Label>
                <Input id="password" name="password" type="password" placeholder="masukkan kata sandi" className="text-body-md" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-small">Ingat Saya</Label>
                </div>
                <Link to="/auth/forgot" className="text-sm text-primary hover:underline">Lupa kata sandi?</Link>
              </div>

              <Button type="submit" className="w-full text-body-md bg-black hover:opacity-70 text-white hover:bg-navy-hover">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4M21 12v6a2 2 0 0 1-2 2H11" />
                </svg>
                Sign In
              </Button>
            </form>
          </CardContent>
         
        </Card>
      </div>
    </div>
  )
}

export default Login
