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
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
      <div className="flex flex-col items-center gap-6">


        <div className="text-center">
          <h1 className="text-lg font-semibold">Sistem Internal TIK</h1>
          <p className="text-sm text-muted-foreground">Universitas</p>
        </div>

        <Card className="w-[360px]">
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
            <CardDescription className="text-center">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="email">Institutional Email</Label>
                <Input id="email" name="email" type="email" placeholder="yourname@university.ac.id" />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="Enter your password" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember">Remember me</Label>
                </div>
                <a className="text-sm text-primary hover:underline">Forgot password?</a>
              </div>

              <Button type="submit" className="w-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H3m0 0l4-4m-4 4l4 4M21 12v6a2 2 0 0 1-2 2H11" />
                </svg>
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-3">
            <a className="text-sm">Back to SSO</a>
            <div className="text-center text-xs text-muted-foreground">
              Don't have access?
              <div>
                <Button variant="outline" size="sm">Request Access</Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default Login
