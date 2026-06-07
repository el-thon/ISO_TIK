// pages/topics/detail/components/Routings.jsx
import React from 'react'
import { GitBranch, User, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatDate, getInitials } from '../utils'

export const Routings = ({ routings }) => {
  if (!routings || routings.length === 0) return null

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'in_progress':
        return <Clock className="h-3 w-3 text-blue-500" />
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-500" />
      default:
        return <Clock className="h-3 w-3 text-yellow-500" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <GitBranch className="h-4 w-4" />
        Routing
      </h3>
      <div className="space-y-3">
        {routings.map((routing, index) => (
          <div key={routing.id || index} className="border rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Step {routing.step || index + 1}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(routing.status)}`}>
                  {getStatusIcon(routing.status)}
                  {routing.status?.replace('_', ' ') || 'Pending'}
                </span>
              </div>
              {routing.due_date && (
                <span className="text-xs text-muted-foreground">
                  Deadline: {formatDate(routing.due_date)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(routing.assignee?.name || routing.assignee?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {routing.assignee?.name || routing.assignee?.username || 'Unassigned'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {routing.role || 'Reviewer'}
                </p>
              </div>
              {routing.completed_at && (
                <span className="text-xs text-muted-foreground">
                  Selesai: {formatDate(routing.completed_at, true)}
                </span>
              )}
            </div>

            {routing.notes && (
              <div className="mt-2 text-xs text-muted-foreground bg-slate-50 p-2 rounded">
                <span className="font-medium">Catatan:</span> {routing.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}