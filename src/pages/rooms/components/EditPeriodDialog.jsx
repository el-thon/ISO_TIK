import { useState } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import UpdatePeriodForm from './UpdatePeriodForm'

export default function EditPeriodDialog({ period }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="xs"
          variant="outline"
          className="px-2 py-1"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          Ubah
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ubah Periode</DialogTitle>
          <DialogDescription>Perbarui nama, tipe, atau deadline periode.</DialogDescription>
        </DialogHeader>
        <UpdatePeriodForm period={period} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}