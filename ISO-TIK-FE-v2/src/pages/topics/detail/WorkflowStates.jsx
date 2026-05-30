// pages/topics/detail/components/WorkflowStates.jsx
import React from 'react'
import { History, User, CheckCircle, Clock, XCircle, FileText, AlertTriangle } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate, getInitials } from '../utils'

export const WorkflowStates = ({ states }) => {
  if (!states || states.length === 0) return null

  const getStateIcon = (state) => {
    switch (state) {
      case 'draft':
        return <FileText className="h-3 w-3 text-gray-500" />
      case 'in_review':
        return <Clock className="h-3 w-3 text-blue-500" />
      case 'changes_requested':
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-500" />
      case 'closed':
        return <CheckCircle className="h-3 w-3 text-purple-500" />
      default:
        return <History className="h-3 w-3 text-gray-500" />
    }
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      case 'changes_requested': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'closed': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <History className="h-4 w-4" />
        Riwayat Workflow
      </h3>
      <div className="space-y-3">
        {states.map((state, index) => (
          <div key={state.id || index} className="relative pl-6 pb-3 border-l-2 border-slate-200 last:pb-0 last:border-l-0">
            <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStateIcon(state.state)}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStateColor(state.state)}`}>
                    {state.state?.replace('_', ' ') || '-'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(state.created_at, true)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(state.changed_by?.name || state.changed_by?.username)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span className="text-xs font-medium">
                    {state.changed_by?.name || state.changed_by?.username || 'System'}
                  </span>
                  {state.changed_by?.role && (
                    <span className="text-xs text-muted-foreground ml-1">
                      • {state.changed_by.role}
                    </span>
                  )}
                </div>
              </div>

              {state.comment && (
                <div className="mt-2 text-xs bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-slate-700 whitespace-pre-line">{state.comment}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}