import { memo } from 'react'
import { Clock, Wifi, Hash, AlertCircle, CheckCircle2, XCircle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ExecutionProgressSteps from './ExecutionProgressSteps'

const getStatusBadge = (status, connectionLost) => {
  if (connectionLost) {
    return {
      label: 'Connection Lost',
      variant: 'destructive',
      icon: AlertCircle
    }
  }

  const statusMap = {
    idle: { label: 'Starting', variant: 'secondary', icon: Info },
    analyzing: { label: 'Analyzing', variant: 'default', icon: Info },
    frequency_prompt: { label: 'Frequency Prompt', variant: 'default', icon: Info },
    enabling_frequencies: { label: 'Enabling Frequencies', variant: 'default', icon: Info },
    waiting_connection: { label: 'Waiting Connection', variant: 'default', icon: Info },
    completed: { label: 'Completed', variant: 'outline', icon: CheckCircle2 },
    error: { label: 'Error', variant: 'destructive', icon: XCircle }
  }

  return statusMap[status] || statusMap.idle
}

const formatDuration = (startedAt, completedAt) => {
  const end = completedAt || Date.now()
  const durationMs = end - startedAt
  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }
  return `${seconds}s`
}

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const ExecutionCard = memo(({ execution, onViewDetails, onCancel }) => {
  const {
    id,
    deviceIp,
    deviceMac,
    status,
    error,
    startedAt,
    completedAt,
    connectionLost,
    progress
  } = execution

  const statusBadge = getStatusBadge(status, connectionLost)
  const StatusIcon = statusBadge.icon
  const isActive = !['completed', 'error'].includes(status) && !connectionLost
  const duration = formatDuration(startedAt, completedAt)

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      isActive && 'border-blue-300',
      connectionLost && 'border-orange-300 bg-orange-50/30'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-mono text-sm font-medium truncate">{deviceIp}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-mono text-xs text-muted-foreground truncate">{deviceMac}</span>
            </div>
          </div>
          <Badge
            variant={statusBadge.variant}
            className={cn(
              "flex items-center gap-1 flex-shrink-0",
              status === 'completed' && "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {statusBadge.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Steps */}
        {!connectionLost && (
          <ExecutionProgressSteps status={status} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Started</p>
            <p className="text-sm font-medium">{formatTimestamp(startedAt)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-sm font-medium">
              <Clock className="inline h-3 w-3 mr-1" />
              {duration}
            </p>
          </div>
        </div>

        {/* Progress Message */}
        {progress && !connectionLost && (
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {progress.currentStep}
            </p>
            <p className="text-sm">{progress.message}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-destructive mb-1">Error</p>
                <p className="text-sm text-destructive break-words">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Lost Warning */}
        {connectionLost && (
          <div className="rounded-md bg-orange-100 dark:bg-orange-900/20 p-3 border border-orange-200 dark:border-orange-800">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  This execution was interrupted by a page refresh. Results are unavailable.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {status === 'completed' && onViewDetails && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(execution)}
              className="flex-1"
            >
              View Details
            </Button>
          )}
          {isActive && onCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(id)}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          {(status === 'error' || connectionLost) && (
            <Button
              size="sm"
              variant="outline"
              disabled
              className="flex-1"
            >
              Retry (Coming Soon)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
})

ExecutionCard.displayName = 'ExecutionCard'

export default ExecutionCard
