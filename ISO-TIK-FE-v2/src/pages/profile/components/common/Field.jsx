import React from 'react'

export const Field = ({ label, children }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    {children}
  </div>
)