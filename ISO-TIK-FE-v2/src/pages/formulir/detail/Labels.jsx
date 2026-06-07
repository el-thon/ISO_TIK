// pages/formulir/detail/components/Labels.jsx
import React from 'react'
import { Tag } from 'lucide-react'

export const Labels = ({ labels }) => {
  if (!labels || labels.length === 0) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Label
      </h3>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label.id}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: label.color ? `${label.color}20` : '#e2e8f0',
              color: label.color || '#334155',
            }}
          >
            {label.name}
          </span>
        ))}
      </div>
    </div>
  )
}
