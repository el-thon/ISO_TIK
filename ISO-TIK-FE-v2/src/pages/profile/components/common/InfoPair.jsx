import React from 'react'

export const InfoPair = ({ label, value }) => (
  <div className="mt-4 first:mt-0">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-medium text-sm text-foreground wrap-break-word">{value || '-'}</div>
  </div>
)