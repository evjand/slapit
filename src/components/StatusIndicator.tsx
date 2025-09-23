import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export default function StatusIndicator({ status }: { status: string }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'active' ? 'bg-emerald-500' : 'bg-red-500',
        )}
        aria-hidden="true"
      ></span>
      {status}
    </Badge>
  )
}
