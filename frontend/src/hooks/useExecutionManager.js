import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for managing parallel device analysis executions
 *
 * Features:
 * - Map-based state for active executions
 * - SessionStorage persistence for active executions (survive page refresh)
 * - LocalStorage persistence for history (max 100 items, 7 days retention)
 * - Concurrency limit (max 5 active executions)
 * - Automatic cleanup and LRU eviction
 */

const MAX_ACTIVE_EXECUTIONS = 5
const MAX_HISTORY_ITEMS = 100
const HISTORY_RETENTION_DAYS = 7
const ACTIVE_STORAGE_KEY = 'device_analysis_active'
const HISTORY_STORAGE_KEY = 'device_analysis_history'

/**
 * AnalysisExecution structure:
 * {
 *   id: string (UUID)
 *   deviceIp: string
 *   deviceMac: string
 *   status: 'idle' | 'analyzing' | 'frequency_prompt' | 'enabling_frequencies' | 'waiting_connection' | 'completed' | 'error'
 *   result: any | null
 *   error: string | null
 *   progress: {
 *     currentStep: string
 *     message: string
 *     timestamp: number
 *   }
 *   startedAt: number
 *   completedAt: number | null
 *   connectionLost: boolean (true if restored from storage after page refresh)
 * }
 */

const generateExecutionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

const cleanOldHistory = (history) => {
  const cutoffTime = Date.now() - (HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  return history.filter(item => item.startedAt > cutoffTime)
}

const loadFromStorage = (key, isMap = false) => {
  try {
    const stored = sessionStorage.getItem(key) || localStorage.getItem(key)
    if (!stored) return isMap ? new Map() : []

    const parsed = JSON.parse(stored)
    if (isMap) {
      return new Map(Object.entries(parsed))
    }
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error(`Error loading from storage (${key}):`, error)
    return isMap ? new Map() : []
  }
}

const saveToStorage = (key, data, useSessionStorage = false) => {
  try {
    const storage = useSessionStorage ? sessionStorage : localStorage
    const serialized = data instanceof Map
      ? JSON.stringify(Object.fromEntries(data))
      : JSON.stringify(data)
    storage.setItem(key, serialized)
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error)
    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, clearing old data...')
      if (!useSessionStorage) {
        // Clear old history items
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const parsed = JSON.parse(stored)
            const cleaned = Array.isArray(parsed)
              ? parsed.slice(-Math.floor(MAX_HISTORY_ITEMS / 2))
              : []
            localStorage.setItem(key, JSON.stringify(cleaned))
          }
        } catch (e) {
          console.error('Error cleaning storage:', e)
        }
      }
    }
  }
}

export const useExecutionManager = () => {
  const [activeExecutions, setActiveExecutions] = useState(() => {
    // On initial load, restore active executions from sessionStorage
    const restored = loadFromStorage(ACTIVE_STORAGE_KEY, true)
    // Mark all restored executions as connection lost
    if (restored.size > 0) {
      restored.forEach((execution, id) => {
        restored.set(id, {
          ...execution,
          connectionLost: true,
          status: execution.status === 'completed' || execution.status === 'error'
            ? execution.status
            : 'error',
          error: execution.error || 'Connection lost - page was refreshed during execution'
        })
      })
    }
    return restored
  })

  const [history, setHistory] = useState(() => {
    const stored = loadFromStorage(HISTORY_STORAGE_KEY, false)
    return cleanOldHistory(stored)
  })

  // Persist active executions to sessionStorage
  useEffect(() => {
    saveToStorage(ACTIVE_STORAGE_KEY, activeExecutions, true)
  }, [activeExecutions])

  // Persist history to localStorage
  useEffect(() => {
    const cleaned = cleanOldHistory(history)
    saveToStorage(HISTORY_STORAGE_KEY, cleaned, false)
  }, [history])

  // Computed values
  const activeCount = activeExecutions.size
  const canStartNew = activeCount < MAX_ACTIVE_EXECUTIONS
  const completedCount = history.length

  /**
   * Start a new execution
   * @param {string} deviceIp - Device IP address
   * @param {string} deviceMac - Device MAC address
   * @returns {string|null} Execution ID if started, null if limit reached
   */
  const startExecution = useCallback((deviceIp, deviceMac) => {
    if (!canStartNew) {
      console.warn(`Cannot start new execution: limit of ${MAX_ACTIVE_EXECUTIONS} reached`)
      return null
    }

    const executionId = generateExecutionId()
    const execution = {
      id: executionId,
      deviceIp,
      deviceMac,
      status: 'idle',
      result: null,
      error: null,
      progress: {
        currentStep: 'Starting',
        message: 'Initializing analysis...',
        timestamp: Date.now()
      },
      startedAt: Date.now(),
      completedAt: null,
      connectionLost: false
    }

    setActiveExecutions(prev => {
      const next = new Map(prev)
      next.set(executionId, execution)
      return next
    })

    return executionId
  }, [canStartNew])

  /**
   * Update an execution's state
   * @param {string} executionId - Execution ID
   * @param {object} updates - Partial updates to apply
   */
  const updateExecution = useCallback((executionId, updates) => {
    setActiveExecutions(prev => {
      const execution = prev.get(executionId)
      if (!execution) {
        console.warn(`Execution ${executionId} not found`)
        return prev
      }

      const next = new Map(prev)
      const updated = {
        ...execution,
        ...updates,
        progress: updates.progress
          ? { ...execution.progress, ...updates.progress, timestamp: Date.now() }
          : execution.progress
      }
      next.set(executionId, updated)
      return next
    })
  }, [])

  /**
   * Complete an execution successfully
   * @param {string} executionId - Execution ID
   * @param {any} result - Analysis result
   */
  const completeExecution = useCallback((executionId, result) => {
    setActiveExecutions(prev => {
      const execution = prev.get(executionId)
      if (!execution) {
        console.warn(`Execution ${executionId} not found`)
        return prev
      }

      const completed = {
        ...execution,
        status: 'completed',
        result,
        completedAt: Date.now(),
        progress: {
          currentStep: 'Completed',
          message: 'Analysis completed successfully',
          timestamp: Date.now()
        }
      }

      // Move to history
      setHistory(prevHistory => {
        const newHistory = [completed, ...prevHistory]
        // Keep only MAX_HISTORY_ITEMS most recent
        return newHistory.slice(0, MAX_HISTORY_ITEMS)
      })

      // Remove from active executions
      const next = new Map(prev)
      next.delete(executionId)

      // Clean up sessionStorage entry
      try {
        sessionStorage.removeItem(`${ACTIVE_STORAGE_KEY}_${executionId}`)
      } catch (e) {
        console.error('Error cleaning up sessionStorage:', e)
      }

      return next
    })
  }, [])

  /**
   * Mark an execution as failed
   * @param {string} executionId - Execution ID
   * @param {string} error - Error message
   */
  const failExecution = useCallback((executionId, error) => {
    setActiveExecutions(prev => {
      const execution = prev.get(executionId)
      if (!execution) {
        console.warn(`Execution ${executionId} not found`)
        return prev
      }

      const failed = {
        ...execution,
        status: 'error',
        error,
        completedAt: Date.now(),
        progress: {
          currentStep: 'Error',
          message: error,
          timestamp: Date.now()
        }
      }

      // Move to history
      setHistory(prevHistory => {
        const newHistory = [failed, ...prevHistory]
        return newHistory.slice(0, MAX_HISTORY_ITEMS)
      })

      // Remove from active executions
      const next = new Map(prev)
      next.delete(executionId)

      // Clean up sessionStorage entry
      try {
        sessionStorage.removeItem(`${ACTIVE_STORAGE_KEY}_${executionId}`)
      } catch (e) {
        console.error('Error cleaning up sessionStorage:', e)
      }

      return next
    })
  }, [])

  /**
   * Get a specific execution
   * @param {string} executionId - Execution ID
   * @returns {object|undefined} Execution object or undefined
   */
  const getExecution = useCallback((executionId) => {
    return activeExecutions.get(executionId)
  }, [activeExecutions])

  /**
   * Clear all completed history (keep active executions)
   */
  const clearHistory = useCallback(() => {
    setHistory([])
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY)
    } catch (e) {
      console.error('Error clearing history:', e)
    }
  }, [])

  /**
   * Cancel an active execution
   * @param {string} executionId - Execution ID
   */
  const cancelExecution = useCallback((executionId) => {
    failExecution(executionId, 'Analysis cancelled by user')
  }, [failExecution])

  return {
    // State
    activeExecutions,
    history,

    // Computed values
    activeCount,
    canStartNew,
    completedCount,
    maxExecutions: MAX_ACTIVE_EXECUTIONS,

    // Actions
    startExecution,
    updateExecution,
    completeExecution,
    failExecution,
    cancelExecution,
    getExecution,
    clearHistory
  }
}
