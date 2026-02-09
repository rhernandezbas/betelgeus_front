import { useState, useEffect, useCallback, useMemo } from 'react'
import { nocApi } from '@/lib/nocApi'

/**
 * Custom hook for managing NOC Dashboard data
 * Provides state, loading, error handling, and CRUD operations for:
 * - Sites (monitoring data)
 * - Events (incidents)
 * - Post-Mortems (incident analysis)
 * - Polling (auto-scan control)
 * - Health (system status)
 */

export const useNOCData = () => {
  // Sites State
  const [sites, setSites] = useState([])
  const [outageSites, setOutageSites] = useState([])
  const [sitesLoading, setSitesLoading] = useState(false)

  // Events State
  const [events, setEvents] = useState([])
  const [activeEvents, setActiveEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)

  // Post-Mortem State
  const [postMortems, setPostMortems] = useState([])
  const [postMortemsLoading, setPostMortemsLoading] = useState(false)

  // Polling State
  const [pollingStatus, setPollingStatus] = useState(null)
  const [pollingLoading, setPollingLoading] = useState(false)

  // Health State
  const [health, setHealth] = useState(null)

  // Auto-refresh State
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Error State
  const [error, setError] = useState(null)

  // ==================== SITES ====================

  const fetchSites = useCallback(async () => {
    setSitesLoading(true)
    try {
      const data = await nocApi.sites.getAll()
      setSites(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      console.error('Error fetching sites:', err)
      setError(err.message)
    } finally {
      setSitesLoading(false)
    }
  }, [])

  const fetchOutageSites = useCallback(async () => {
    setSitesLoading(true)
    try {
      const data = await nocApi.sites.getOutages()
      setOutageSites(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      console.error('Error fetching outage sites:', err)
      setError(err.message)
    } finally {
      setSitesLoading(false)
    }
  }, [])

  const scanSites = useCallback(async (withAlerts = true) => {
    setSitesLoading(true)
    try {
      const result = withAlerts
        ? await nocApi.sites.scanWithAlerts()
        : await nocApi.sites.scan()

      // Refresh sites after scan
      await fetchOutageSites()
      await fetchSites()

      return result
    } catch (err) {
      console.error('Error scanning sites:', err)
      setError(err.message)
      throw err
    } finally {
      setSitesLoading(false)
    }
  }, [fetchOutageSites, fetchSites])

  // ==================== EVENTS ====================

  const fetchEvents = useCallback(async (params = {}) => {
    setEventsLoading(true)
    try {
      const data = await nocApi.events.getAll(params)
      setEvents(Array.isArray(data) ? data : data.events || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError(err.message)
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const fetchActiveEvents = useCallback(async () => {
    setEventsLoading(true)
    try {
      const data = await nocApi.events.getActive()
      setActiveEvents(Array.isArray(data) ? data : data.events || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching active events:', err)
      setError(err.message)
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const createEvent = useCallback(async (eventData) => {
    try {
      const result = await nocApi.events.create(eventData)
      await fetchActiveEvents()
      return result
    } catch (err) {
      console.error('Error creating event:', err)
      throw err
    }
  }, [fetchActiveEvents])

  const acknowledgeEvent = useCallback(async (eventId, data) => {
    try {
      const result = await nocApi.events.acknowledge(eventId, data)
      await fetchActiveEvents()
      return result
    } catch (err) {
      console.error('Error acknowledging event:', err)
      throw err
    }
  }, [fetchActiveEvents])

  const resolveEvent = useCallback(async (eventId, data) => {
    try {
      const result = await nocApi.events.resolve(eventId, data)
      await fetchActiveEvents()
      return result
    } catch (err) {
      console.error('Error resolving event:', err)
      throw err
    }
  }, [fetchActiveEvents])

  const deleteEvent = useCallback(async (eventId) => {
    try {
      const result = await nocApi.events.delete(eventId)
      await fetchActiveEvents()
      return result
    } catch (err) {
      console.error('Error deleting event:', err)
      throw err
    }
  }, [fetchActiveEvents])

  // ==================== POST-MORTEM ====================

  const fetchPostMortems = useCallback(async (params = {}) => {
    setPostMortemsLoading(true)
    try {
      const data = await nocApi.postMortem.getAll(params)
      setPostMortems(Array.isArray(data) ? data : data.post_mortems || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching post-mortems:', err)
      setError(err.message)
    } finally {
      setPostMortemsLoading(false)
    }
  }, [])

  const createPostMortem = useCallback(async (pmData) => {
    try {
      // Clean data before sending - convert empty strings to null
      const cleanData = {
        ...pmData,
        alert_event_id: pmData.alert_event_id || null,
        title: pmData.title || 'Post-Mortem Sin Título',
        summary: pmData.summary || null,
        root_cause: pmData.root_cause || null,
        author: pmData.author || null,
        lessons_learned: pmData.lessons_learned || null,
        // Filter out empty timeline events
        timeline_events: (pmData.timeline_events || []).filter(
          item => item.time || item.event || item.actor
        ),
        // Filter out empty preventive actions
        preventive_actions: (pmData.preventive_actions || []).filter(
          item => item.action
        ),
        // Filter out empty action items
        action_items: (pmData.action_items || []).filter(
          item => item.item
        )
      }
      const result = await nocApi.postMortem.create(cleanData)
      await fetchPostMortems()
      return result
    } catch (err) {
      console.error('Error creating post-mortem:', err)
      throw err
    }
  }, [fetchPostMortems])

  // Auto-create post-mortem for site outage
  const createPostMortemForSite = useCallback(async (site) => {
    const pmData = {
      title: `Post-Mortem: Caída de ${site.site_name}`,
      summary: `Site ${site.site_name} experimentó una caída con ${site.device_outage_count}/${site.device_count} dispositivos afectados (${site.outage_percentage?.toFixed(1)}% de caída).`,
      root_cause: null,
      author: null,
      incident_start: new Date().toISOString(),
      timeline_events: [
        {
          time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          event: `Detectada caída del site ${site.site_name}`,
          actor: 'Sistema NOC'
        }
      ],
      preventive_actions: [],
      action_items: [],
      custom_data: {
        site_id: site.site_id,
        site_name: site.site_name,
        device_count: site.device_count,
        device_outage_count: site.device_outage_count,
        outage_percentage: site.outage_percentage
      }
    }
    return createPostMortem(pmData)
  }, [createPostMortem])

  const updatePostMortem = useCallback(async (pmId, pmData) => {
    try {
      const result = await nocApi.postMortem.update(pmId, pmData)
      await fetchPostMortems()
      return result
    } catch (err) {
      console.error('Error updating post-mortem:', err)
      throw err
    }
  }, [fetchPostMortems])

  const completePostMortem = useCallback(async (pmId) => {
    try {
      const result = await nocApi.postMortem.complete(pmId)
      await fetchPostMortems()
      return result
    } catch (err) {
      console.error('Error completing post-mortem:', err)
      throw err
    }
  }, [fetchPostMortems])

  const reviewPostMortem = useCallback(async (pmId) => {
    try {
      const result = await nocApi.postMortem.review(pmId)
      await fetchPostMortems()
      return result
    } catch (err) {
      console.error('Error reviewing post-mortem:', err)
      throw err
    }
  }, [fetchPostMortems])

  const getPostMortemReport = useCallback(async (pmId) => {
    try {
      return await nocApi.postMortem.getReport(pmId)
    } catch (err) {
      console.error('Error getting post-mortem report:', err)
      throw err
    }
  }, [])

  const deletePostMortem = useCallback(async (pmId) => {
    try {
      const result = await nocApi.postMortem.delete(pmId)
      await fetchPostMortems()
      return result
    } catch (err) {
      console.error('Error deleting post-mortem:', err)
      throw err
    }
  }, [fetchPostMortems])

  // ==================== POLLING ====================

  const fetchPollingStatus = useCallback(async () => {
    setPollingLoading(true)
    try {
      const data = await nocApi.polling.getStatus()
      setPollingStatus(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching polling status:', err)
      setError(err.message)
    } finally {
      setPollingLoading(false)
    }
  }, [])

  const startPolling = useCallback(async () => {
    try {
      const result = await nocApi.polling.start()
      await fetchPollingStatus()
      return result
    } catch (err) {
      console.error('Error starting polling:', err)
      throw err
    }
  }, [fetchPollingStatus])

  const stopPolling = useCallback(async () => {
    try {
      const result = await nocApi.polling.stop()
      await fetchPollingStatus()
      return result
    } catch (err) {
      console.error('Error stopping polling:', err)
      throw err
    }
  }, [fetchPollingStatus])

  // ==================== WHATSAPP ====================

  const testWhatsApp = useCallback(async (type = 'complete', siteId = null) => {
    try {
      const data = { type }
      if (siteId) data.site_id = siteId
      return await nocApi.whatsapp.testNotification(data)
    } catch (err) {
      console.error('Error testing WhatsApp:', err)
      throw err
    }
  }, [])

  // ==================== HEALTH ====================

  const fetchHealth = useCallback(async () => {
    try {
      const data = await nocApi.health.check()
      setHealth(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching health:', err)
      setError(err.message)
    }
  }, [])

  // ==================== COMPUTED VALUES ====================

  const stats = useMemo(() => {
    const totalSites = sites.length
    const sitesDown = outageSites.filter(s => s.is_site_down).length
    const sitesDegraded = outageSites.filter(s => !s.is_site_down && s.outage_percentage > 0).length
    const sitesHealthy = totalSites - sitesDown - sitesDegraded

    const criticalEvents = activeEvents.filter(e => e.severity === 'critical').length
    const highEvents = activeEvents.filter(e => e.severity === 'high').length
    const acknowledgedEvents = activeEvents.filter(e => e.status === 'acknowledged').length

    return {
      totalSites,
      sitesDown,
      sitesDegraded,
      sitesHealthy,
      uptimePercent: totalSites > 0 ? ((sitesHealthy / totalSites) * 100).toFixed(1) : 100,
      totalActiveEvents: activeEvents.length,
      criticalEvents,
      highEvents,
      acknowledgedEvents,
      totalPostMortems: postMortems.length,
      completedPostMortems: postMortems.filter(pm => pm.status === 'completed').length
    }
  }, [sites, outageSites, activeEvents, postMortems])

  // ==================== REFRESH ALL ====================

  const refreshAll = useCallback(async () => {
    setLastUpdate(new Date())
    await Promise.all([
      fetchSites(),
      fetchOutageSites(),
      fetchActiveEvents(),
      fetchPollingStatus(),
      fetchHealth()
    ])
  }, [fetchSites, fetchOutageSites, fetchActiveEvents, fetchPollingStatus, fetchHealth])

  // ==================== AUTO-REFRESH EFFECT ====================

  useEffect(() => {
    refreshAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Initial load - refreshAll intentionally excluded to run only once

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshAll()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, refreshAll])

  return {
    // Sites
    sites,
    outageSites,
    sitesLoading,
    fetchSites,
    fetchOutageSites,
    scanSites,

    // Events
    events,
    activeEvents,
    eventsLoading,
    fetchEvents,
    fetchActiveEvents,
    createEvent,
    acknowledgeEvent,
    resolveEvent,
    deleteEvent,

    // Post-Mortems
    postMortems,
    postMortemsLoading,
    fetchPostMortems,
    createPostMortem,
    createPostMortemForSite,
    updatePostMortem,
    completePostMortem,
    reviewPostMortem,
    getPostMortemReport,
    deletePostMortem,

    // Polling
    pollingStatus,
    pollingLoading,
    fetchPollingStatus,
    startPolling,
    stopPolling,

    // WhatsApp
    testWhatsApp,

    // Health
    health,
    fetchHealth,

    // Computed
    stats,

    // Refresh
    autoRefresh,
    setAutoRefresh,
    lastUpdate,
    refreshAll,

    // Error
    error,
    setError
  }
}

export default useNOCData
