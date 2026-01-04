import React from 'react'
function AuthLayout({ children, title, subtitle }) {
  return (
  <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-white to-slate-50 px-4">
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="text-center">
          <h1 className="text-heading-3 font-semibold text-navy">{title}</h1>
          {subtitle && <p className="text-body-md text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

export default AuthLayout
