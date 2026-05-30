import React from 'react'

export const StatusMessage = ({ message, type, className = "" }) => {
  if (!message) return null
  
  const colorClass = type === 'success' 
    ? 'text-emerald-600' 
    : type === 'error' 
      ? 'text-red-600' 
      : 'text-muted-foreground'
  
  return <p className={`text-sm mt-4 ${colorClass} ${className}`}>{message}</p>
}