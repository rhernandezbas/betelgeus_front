import { Activity, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ExecutionCard from './ExecutionCard'

/**
 * Panel displaying all active executions in a responsive grid
 * Shows limit indicator and empty state when no executions
 */

export default function ExecutionsPanel({
  activeExecutions,
  activeCount,
  maxExecutions,
  canStartNew,
  onViewDetails,
  onCancel
}) {
  // Convert Map to array for rendering
  const executionsArray = Array.from(activeExecutions.values())

  if (executionsArray.length === 0) {
    return null // Don't show panel when no active executions
  }

  return (
    <div className="space-y-4">
      {/* Header with limit indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Active Executions</h2>
          <Badge variant={canStartNew ? 'secondary' : 'destructive'}>
            {activeCount}/{maxExecutions}
          </Badge>
        </div>
      </div>

      {/* Limit warning */}
      {!canStartNew && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Maximum of {maxExecutions} analyses can run simultaneously. Wait for an execution to complete before starting a new one.
          </AlertDescription>
        </Alert>
      )}

      {/* Executions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {executionsArray.map((execution) => (
          <ExecutionCard
            key={execution.id}
            execution={execution}
            onViewDetails={onViewDetails}
            onCancel={onCancel}
          />
        ))}
      </div>
    </div>
  )
}
