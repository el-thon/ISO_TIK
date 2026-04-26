import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'
import { formatDate } from '../constants'
import EditPeriodDialog from './EditPeriodDialog'

export default function PeriodCard({ period, isDisabled, isProductOwner, joinMutation, onJoin, onSelect }) {
  return (
    <Card
      className="cursor-pointer relative"
      onClick={() => onSelect(period)}
    >
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-semibold text-lg wrap-break-word">{period.name}</div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 whitespace-nowrap">
                {period.member_count ?? 0} anggota
              </span>
              {isDisabled && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 whitespace-nowrap">
                  Belum bergabung
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
              Tipe: {period.period_type || '-'}
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Deadline: {formatDate(period.end_date)}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Dibuat oleh: {(
                period.owner?.name || period.owner?.profile?.full_name || 
                period.created_by?.name || period.created_by?.profile?.full_name || 
                period.created_by_username || period.created_by || '—'
              )}
            </div>
          </div>
          {isDisabled && !isProductOwner && (
            <Button
              size="xs"
              className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={joinMutation.isPending}
              onClick={(event) => {
                event.stopPropagation()
                onJoin(period)
              }}
            >
              <LogIn className="w-4 h-4 mr-1" /> Join
            </Button>
          )}
        </div>
        {period?.current_user_role === 'owner' && (
          <div className="absolute top-3 right-3">
            <EditPeriodDialog period={period} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}