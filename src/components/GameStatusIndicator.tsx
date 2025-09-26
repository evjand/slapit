import { Badge } from './ui/badge'
import { cn } from '@/lib/utils'

interface GameStatusIndicatorProps {
  status: 'setup' | 'active' | 'completed' | 'pending'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function GameStatusIndicator({
  status,
  className,
  size = 'md',
}: GameStatusIndicatorProps) {
  const getStatusConfig = (
    status: 'setup' | 'active' | 'completed' | 'pending',
  ) => {
    switch (status) {
      case 'setup':
        return {
          label: 'Setup',
          variant: 'secondary' as const,
          className:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        }
      case 'active':
        return {
          label: 'Active',
          variant: 'default' as const,
          className:
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        }
      case 'completed':
        return {
          label: 'Completed',
          variant: 'outline' as const,
          className:
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        }
      case 'pending':
        return {
          label: 'Pending',
          variant: 'secondary' as const,
          className:
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        }
      default:
        return {
          label: 'Unknown',
          variant: 'secondary' as const,
          className:
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        }
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1'
      case 'lg':
        return 'text-lg px-4 py-2'
      default:
        return 'text-sm px-3 py-1'
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, getSizeClasses(), className)}
    >
      {config.label}
    </Badge>
  )
}
