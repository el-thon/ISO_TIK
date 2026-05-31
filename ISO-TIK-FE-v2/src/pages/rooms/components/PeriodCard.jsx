import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogIn } from 'lucide-react'
import { formatDate } from '../constants'

export default function PeriodCard({
  period,
  isDisabled,
  isProductOwner,
  isJoinPending,
  joinMutation,
  onJoin,
  onSelect,
}) {
  return (
    <Card
      className="cursor-pointer relative"
      onClick={() => onSelect(period)}
    >
      <CardContent className="pt-4">
        {/* Title section - tanpa button */}
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
        
        {/* Button section - terpisah, di bagian bawah */}
        <div className="mt-3">
          {isDisabled && !isProductOwner && (
            isJoinPending ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 cursor-default"
                disabled
                onClick={(event) => event.stopPropagation()}
              >
                Menunggu tanggapan
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={joinMutation.isPending}
                onClick={(event) => {
                  event.stopPropagation()
                  onJoin(period)
                }}
              >
                <LogIn className="w-3.5 h-3.5 mr-1" /> Join
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  )
}
