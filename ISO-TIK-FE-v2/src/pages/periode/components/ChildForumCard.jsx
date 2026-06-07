import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'

export default function ChildForumCard({ room }) {
  const createdBy =
    room?.created_by_user?.name ||
    room?.created_by_user?.username ||
    room?.owner?.name ||
    room?.owner?.username ||
    room?.created_by ||
    room?.created_by_username ||
    room?.responsible_user?.name ||
    room?.responsible_user?.username ||
    '-'
  const participantCount = room?.participant_count ?? room?.participants_count ?? 0

  return (
    <Card className={`transition-shadow hover:shadow-md ${room.is_archived ? 'opacity-80' : ''}`}>
      <div className="relative">
        <Link to={`/forum/${room.id}`} className="block no-underline text-inherit">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-lg text-slate-800">{room.name}</div>
                  {room.is_locked && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Locked</span>
                  )}
                  {room.is_archived && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Archived</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-3 line-clamp-3">
                  {room.description || 'Belum ada deskripsi'}
                </div>
                <div className="flex items-center justify-between gap-2 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      {participantCount} peserta
                    </span>
                    <span className="text-xs text-muted-foreground">Dibuat oleh: {createdBy}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      </div>
    </Card>
  )
}
