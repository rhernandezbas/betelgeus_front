import { useState } from 'react'
import { hasPermission, getCurrentUser } from '@/lib/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useNOCData } from '@/hooks/useNOCData'
import {
  RefreshCw,
  Server,
  AlertTriangle,
  Activity,
  FileText,
  Settings,
  Clock,
  Wifi,
  WifiOff,
  Filter,
  Plus,
  BarChart3,
  Lock,
  ShieldAlert,
  XCircle
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Components
import StatsCards from '@/components/noc/StatsCards'
import SiteCard from '@/components/noc/SiteCard'
import EventCard from '@/components/noc/EventCard'
import PostMortemCard from '@/components/noc/PostMortemCard'
import PostMortemEditor from '@/components/noc/PostMortemEditor'
import {
  SeverityPieChart,
  SitesStatusChart,
  EventsByTypeChart,
  UptimeTrendChart,
  TopProblematicSites,
  MTTRStats
} from '@/components/noc/MetricsCharts'
import {
  PollingControl,
  WhatsAppTest,
  HealthCheck,
  SiteDetailsContent
} from '@/components/noc/ControlPanel'

export default function NOCDashboard() {
  // Check user permissions
  const user = getCurrentUser()
  const canAccessControl = hasPermission(user, 'can_access_noc_control')

  // NOC Data Hook
  const {
    sites,
    outageSites,
    sitesLoading,
    scanSites,
    events,
    activeEvents,
    eventsLoading,
    fetchEvents,
    fetchActiveEvents,
    acknowledgeEvent,
    resolveEvent,
    deleteEvent,
    postMortems,
    postMortemsLoading,
    fetchPostMortems,
    createPostMortem,
    updatePostMortem,
    completePostMortem,
    reviewPostMortem,
    getPostMortemReport,
    deletePostMortem,
    pollingStatus,
    pollingLoading,
    startPolling,
    stopPolling,
    sendWhatsAppNotification,
    testWhatsApp,
    health,
    fetchHealth,
    stats,
    autoRefresh,
    setAutoRefresh,
    lastUpdate,
    refreshAll,
    error
  } = useNOCData()

  const { toast } = useToast()

  // Local State
  const [activeTab, setActiveTab] = useState('sites')
  const [eventFilter, setEventFilter] = useState('active')
  const [postMortemFilter, setPostMortemFilter] = useState('')
  const [selectedSite, setSelectedSite] = useState(null)
  const [siteDetailsOpen, setSiteDetailsOpen] = useState(false)
  const [postMortemEditorOpen, setPostMortemEditorOpen] = useState(false)
  const [editingPostMortem, setEditingPostMortem] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Handlers
  const handleScan = async () => {
    try {
      const result = await scanSites(true)
      toast({
        title: 'Escaneo Completado',
        description: `${result.summary?.total_sites || 0} sites escaneados, ${result.summary?.sites_down || 0} caídos detectados`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleViewSiteDetails = (site) => {
    setSelectedSite(site)
    setSiteDetailsOpen(true)
  }

  const handleAcknowledgeEvent = async (eventId, data) => {
    try {
      await acknowledgeEvent(eventId, data)
      toast({
        title: 'Evento Reconocido',
        description: 'El evento ha sido marcado como reconocido'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleResolveEvent = async (eventId, data) => {
    try {
      await resolveEvent(eventId, data)
      toast({
        title: 'Evento Resuelto',
        description: 'El evento ha sido marcado como resuelto'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(eventId)
      toast({
        title: 'Evento Eliminado',
        description: 'El evento ha sido eliminado'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleWhatsAppEvent = async (type, eventId) => {
    try {
      const result = await sendWhatsAppNotification(eventId, type)
      const typeLabels = {
        complete: 'Completo',
        summary: 'Resumen',
        recovery: 'Recuperación'
      }
      toast({
        title: 'Notificación WhatsApp Enviada',
        description: `Mensaje tipo "${typeLabels[type]}" enviado correctamente`
      })
    } catch (error) {
      toast({
        title: 'Error al Enviar WhatsApp',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleCreatePostMortem = async (event) => {
    try {
      // Crear post-mortem automáticamente con datos del evento
      const pmData = {
        alert_event_id: event.id,
        title: `Post-Mortem: ${event.title}`,
        summary: event.description || `Análisis del evento ${event.event_type}`,
        root_cause: null,
        author: user?.username || user?.name || 'Sistema',
        incident_start: event.created_at,
        incident_end: event.resolved_at || null,
        timeline_events: [
          {
            time: new Date(event.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            event: `Evento detectado: ${event.title}`,
            actor: 'Sistema NOC'
          }
        ],
        preventive_actions: [],
        action_items: [],
        custom_data: {
          event_id: event.id,
          event_type: event.event_type,
          severity: event.severity,
          site_id: event.site_id
        }
      }

      await createPostMortem(pmData)

      toast({
        title: 'Post-Mortem Creado',
        description: `Post-mortem creado automáticamente para el evento #${event.id}`
      })

      // Cambiar a la pestaña de post-mortems
      setActiveTab('postmortems')
    } catch (error) {
      toast({
        title: 'Error al Crear Post-Mortem',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleEditPostMortem = (pm) => {
    setSelectedEvent(null)
    setEditingPostMortem(pm)
    setPostMortemEditorOpen(true)
  }

  const handleSavePostMortem = async (data) => {
    try {
      if (editingPostMortem) {
        await updatePostMortem(editingPostMortem.id, data)
        toast({ title: 'Post-Mortem Actualizado' })
      } else {
        await createPostMortem(data)
        toast({ title: 'Post-Mortem Creado' })
      }
      setPostMortemEditorOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleCompletePostMortem = async (pmId) => {
    try {
      await completePostMortem(pmId)
      toast({ title: 'Post-Mortem Completado' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleReviewPostMortem = async (pmId) => {
    try {
      await reviewPostMortem(pmId)
      toast({ title: 'Post-Mortem Revisado' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleDeletePostMortem = async (pmId) => {
    if (!confirm('¿Estás seguro de eliminar este post-mortem?')) return
    try {
      await deletePostMortem(pmId)
      toast({ title: 'Post-Mortem Eliminado' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleDownloadReport = async (pmId) => {
    try {
      const report = await getPostMortemReport(pmId)
      // Download as JSON for now
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `postmortem_${pmId}_report.json`
      a.click()
      toast({ title: 'Reporte Descargado' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Filter events
  const filteredEvents = eventFilter === 'active'
    ? activeEvents
    : eventFilter
    ? events.filter(e => e.status === eventFilter)
    : events

  // Filter post-mortems
  const filteredPostMortems = postMortemFilter
    ? postMortems.filter(pm => pm.status === postMortemFilter)
    : postMortems

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">NOC Dashboard</h1>
          <p className="text-muted-foreground">
            Centro de Operaciones de Red - Monitoreo de Sites UISP
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Last Update */}
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {lastUpdate ? lastUpdate.toLocaleTimeString('es-AR') : 'N/A'}
          </div>

          {/* Auto-refresh Toggle */}
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          {/* Manual Refresh */}
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>

          {/* Scan Button */}
          <Button onClick={handleScan} disabled={sitesLoading}>
            <Wifi className="h-4 w-4 mr-2" />
            Escanear Sites
          </Button>
        </div>
      </div>

      {/* Error Alert - Shows when API is unavailable */}
      {error && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <XCircle className="h-5 w-5" />
          <AlertTitle className="flex items-center gap-2">
            Error de Conexión con API de Alertas
          </AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">
              El servicio de alertas (UISP) no está disponible. Algunas funcionalidades pueden no estar operativas.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={refreshAll}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar Conexión
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={sitesLoading} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${canAccessControl ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="sites" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Sites en Vivo
            {stats?.sitesDown > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.sitesDown}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Eventos
            {stats?.totalActiveEvents > 0 && (
              <Badge variant="destructive" className="ml-1">
                {stats.totalActiveEvents}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas
          </TabsTrigger>
          <TabsTrigger value="postmortem" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Post-Mortem
          </TabsTrigger>
          {canAccessControl && (
            <TabsTrigger value="control" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Control
            </TabsTrigger>
          )}
        </TabsList>

        {/* Sites Tab */}
        <TabsContent value="sites" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-red-600" />
              Sites con Problemas ({outageSites.length})
            </h2>
          </div>

          {sitesLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : outageSites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wifi className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-semibold text-green-700">
                  Todos los Sites Operativos
                </h3>
                <p className="text-muted-foreground">
                  No hay sites con problemas en este momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {outageSites.map((site) => (
                <SiteCard
                  key={site.site_id}
                  site={site}
                  onViewDetails={handleViewSiteDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Eventos</h2>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={eventFilter}
                onChange={(e) => {
                  setEventFilter(e.target.value)
                  if (e.target.value && e.target.value !== 'active') {
                    fetchEvents({ status: e.target.value })
                  } else {
                    fetchActiveEvents()
                  }
                }}
              >
                <option value="active">Activos</option>
                <option value="acknowledged">Reconocidos</option>
                <option value="resolved">Resueltos</option>
                <option value="">Todos</option>
              </select>
            </div>
          </div>

          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold">No hay eventos</h3>
                <p className="text-muted-foreground">
                  No se encontraron eventos con los filtros seleccionados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onAcknowledge={handleAcknowledgeEvent}
                  onResolve={handleResolveEvent}
                  onDelete={handleDeleteEvent}
                  onCreatePostMortem={handleCreatePostMortem}
                  onWhatsApp={handleWhatsAppEvent}
                  currentUser={user}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SitesStatusChart sites={sites} outageSites={outageSites} />
            <SeverityPieChart events={events} />
            <EventsByTypeChart events={events} />
            <UptimeTrendChart stats={stats} />
            <TopProblematicSites outageSites={outageSites} />
            <MTTRStats postMortems={postMortems} />
          </div>
        </TabsContent>

        {/* Post-Mortem Tab */}
        <TabsContent value="postmortem" className="space-y-6">
          {postMortemEditorOpen ? (
            <PostMortemEditor
              postMortem={editingPostMortem}
              event={selectedEvent}
              onSave={handleSavePostMortem}
              onComplete={(data) => {
                handleSavePostMortem(data)
                // Then complete
              }}
              onCancel={() => {
                setPostMortemEditorOpen(false)
                setEditingPostMortem(null)
                setSelectedEvent(null)
              }}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Post-Mortems</h2>
                <div className="flex items-center gap-2">
                  <select
                    className="px-3 py-2 border rounded-md text-sm"
                    value={postMortemFilter}
                    onChange={(e) => {
                      setPostMortemFilter(e.target.value)
                      fetchPostMortems(e.target.value ? { status: e.target.value } : {})
                    }}
                  >
                    <option value="">Todos</option>
                    <option value="draft">Borradores</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completados</option>
                    <option value="reviewed">Revisados</option>
                  </select>
                  <Button onClick={() => {
                    setEditingPostMortem(null)
                    setSelectedEvent(null)
                    setPostMortemEditorOpen(true)
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Post-Mortem
                  </Button>
                </div>
              </div>

              {postMortemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPostMortems.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold">No hay post-mortems</h3>
                    <p className="text-muted-foreground mb-4">
                      Crea un post-mortem para documentar y analizar incidentes
                    </p>
                    <Button onClick={() => setPostMortemEditorOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Post-Mortem
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPostMortems.map((pm) => (
                    <PostMortemCard
                      key={pm.id}
                      postMortem={pm}
                      onView={handleEditPostMortem}
                      onEdit={handleEditPostMortem}
                      onComplete={handleCompletePostMortem}
                      onReview={handleReviewPostMortem}
                      onReport={handleDownloadReport}
                      onDelete={handleDeletePostMortem}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Control Tab - Protected */}
        {canAccessControl ? (
          <TabsContent value="control" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PollingControl
                pollingStatus={pollingStatus}
                loading={pollingLoading}
                onStart={async () => {
                  try {
                    await startPolling()
                    toast({ title: 'Polling Iniciado' })
                  } catch (error) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' })
                  }
                }}
                onStop={async () => {
                  try {
                    await stopPolling()
                    toast({ title: 'Polling Detenido' })
                  } catch (error) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' })
                  }
                }}
                onScan={handleScan}
              />

              <WhatsAppTest onTest={testWhatsApp} />

              <HealthCheck health={health} onRefresh={fetchHealth} />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                  <CardDescription>
                    Atajos para operaciones comunes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab('sites')
                      refreshAll()
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar Todo
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab('events')
                      setEventFilter('active')
                      fetchActiveEvents()
                    }}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Ver Eventos Activos
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setActiveTab('postmortem')
                      setPostMortemEditorOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Post-Mortem
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ) : (
          <TabsContent value="control" className="space-y-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="py-12 text-center">
                <ShieldAlert className="h-16 w-16 mx-auto text-orange-500 mb-4" />
                <h3 className="text-xl font-semibold text-orange-800 mb-2">
                  Acceso Restringido
                </h3>
                <p className="text-orange-700 max-w-md mx-auto">
                  No tienes permisos para acceder al panel de control del NOC.
                  Contacta a un administrador si necesitas acceso.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-full text-sm text-orange-800">
                  <Lock className="h-4 w-4" />
                  Requiere permiso: NOC Control
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Site Details Dialog */}
      <Dialog open={siteDetailsOpen} onOpenChange={setSiteDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-red-600" />
              {selectedSite?.site_name}
            </DialogTitle>
            <DialogDescription>
              Detalles del site y estado de dispositivos
            </DialogDescription>
          </DialogHeader>
          <SiteDetailsContent site={selectedSite} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
