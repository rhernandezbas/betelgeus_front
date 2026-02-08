import { Check, Circle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Visual step indicator for device analysis execution
 * Shows 5-step flow: Analyzing → Frequency Prompt → Enabling Frequencies → Waiting Connection → Completed
 */

const STEPS = [
  { id: 'analyzing', label: 'Analyzing', status: 'analyzing' },
  { id: 'frequency_prompt', label: 'Frequency Prompt', status: 'frequency_prompt' },
  { id: 'enabling_frequencies', label: 'Enabling Frequencies', status: 'enabling_frequencies' },
  { id: 'waiting_connection', label: 'Waiting Connection', status: 'waiting_connection' },
  { id: 'completed', label: 'Completed', status: 'completed' }
]

const getStepState = (stepStatus, currentStatus) => {
  const stepIndex = STEPS.findIndex(s => s.status === stepStatus)
  const currentIndex = STEPS.findIndex(s => s.status === currentStatus)

  if (currentStatus === 'error') {
    // Show error state on current step
    return stepIndex <= currentIndex ? 'error' : 'pending'
  }

  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'pending'
}

const StepIcon = ({ state }) => {
  if (state === 'completed') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
        <Check className="h-4 w-4 text-white" />
      </div>
    )
  }

  if (state === 'current') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
        <Loader2 className="h-4 w-4 animate-spin text-white" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
        <Circle className="h-4 w-4 text-white" />
      </div>
    )
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
      <Circle className="h-4 w-4 text-gray-300" />
    </div>
  )
}

const StepConnector = ({ state }) => {
  return (
    <div
      className={cn(
        'h-0.5 w-full transition-colors',
        state === 'completed' ? 'bg-green-500' : 'bg-gray-300'
      )}
    />
  )
}

export default function ExecutionProgressSteps({ status, className }) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop view - horizontal */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const state = getStepState(step.status, status)
            const isLast = index === STEPS.length - 1

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <StepIcon state={state} />
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium',
                      state === 'current' && 'text-blue-600',
                      state === 'completed' && 'text-green-600',
                      state === 'error' && 'text-red-600',
                      state === 'pending' && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div className="flex-1 px-2">
                    <StepConnector state={state === 'completed' ? 'completed' : 'pending'} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile view - vertical */}
      <div className="md:hidden space-y-3">
        {STEPS.map((step) => {
          const state = getStepState(step.status, status)

          return (
            <div key={step.id} className="flex items-center gap-3">
              <StepIcon state={state} />
              <div className="flex-1">
                <span
                  className={cn(
                    'text-sm font-medium',
                    state === 'current' && 'text-blue-600',
                    state === 'completed' && 'text-green-600',
                    state === 'error' && 'text-red-600',
                    state === 'pending' && 'text-gray-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
