import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { adminApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Calendar, TrendingUp, Clock, AlertCircle, CheckCircle, Filter, Download, Search, Edit2, Trash2, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

export default function Metrics() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    status: 'all',
    operator: 'all',
    priority: 'all'
  })
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [thresholdModal, setThresholdModal] = useState({
    open: false,
    ticketId: null,
    currentStatus: false,
    ticketInfo: null
  })
  const { toast } = useToast()

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getMetrics()
      setMetrics(response.data.metrics)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar métricas',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTickets = async () => {
    try {
      // Obtener tickets desde la base de datos
      const response = await adminApi.getIncidents()
      const incidents = response.data.incidents || []

      console.log('📊 [DEBUG] Tickets recibidos del backend:', incidents.length)
      if (incidents.length > 0) {
        console.log('📊 [DEBUG] Primer ticket del backend (todos los campos):', incidents[0])
        console.log('📊 [DEBUG] Campos disponibles:', Object.keys(incidents[0]))
      }

      // Transformar los datos al formato esperado
      const transformedTickets = incidents.map(incident => ({
        id: incident.id,
        ticket_id: incident.ticket_id,
        cliente: incident.customer_name || 'N/A',
        asunto: incident.subject || 'Sin asunto',
        estado: incident.status_name || 'Desconocido',
        is_closed: incident.is_closed ?? false,  // Usar nullish coalescing
        prioridad: incident.priority_name || 'Media',
        assigned_to: incident.assigned_to,
        operator_name: incident.operator_name || 'Sin asignar',
        created_at: incident.created_at,
        response_time: incident.response_time_minutes,
        exceeded_threshold: incident.exceeded_threshold ?? false,  // Usar nullish coalescing
        recreado: incident.recreado || 0,  // Agregar campo recreado
        // Campos de auditoría
        audit_requested: incident.audit_requested ?? false,
        audit_status: incident.audit_status ?? null,
        audit_notified: incident.audit_notified ?? false,
        audit_requested_at: incident.audit_requested_at ?? null,
        audit_requested_by: incident.audit_requested_by ?? null
      }))

      console.log('📊 [DEBUG] Tickets transformados:', transformedTickets.length)
      if (transformedTickets.length > 0) {
        console.log('📊 [DEBUG] Primer ticket transformado:', transformedTickets[0])
        console.log('📊 [DEBUG] Distribución de estados:', {
          cerrados: transformedTickets.filter(t => t.is_closed === true).length,
          abiertos: transformedTickets.filter(t => t.is_closed === false && t.exceeded_threshold === false).length,
          vencidos_no_auditados: transformedTickets.filter(t => t.exceeded_threshold === true && !t.audit_requested && !t.audit_status).length,
          vencidos_auditados: transformedTickets.filter(t => t.exceeded_threshold === true && (t.audit_requested || t.audit_status)).length,
          auditados: transformedTickets.filter(t => t.audit_requested === true || t.audit_status !== null).length,
          total_con_exceeded_threshold: transformedTickets.filter(t => t.exceeded_threshold === true).length
        })
      }

      setTickets(transformedTickets)
      setFilteredTickets(transformedTickets)
    } catch (error) {
      console.error('Error al cargar tickets:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar tickets',
        variant: 'destructive'
      })
    }
  }

  const handleToggleThreshold = (ticketId, currentStatus, ticketInfo = null) => {
    // Abrir modal de confirmación
    setThresholdModal({
      open: true,
      ticketId,
      currentStatus,
      ticketInfo
    })
  }

  const confirmToggleThreshold = async () => {
    const { ticketId, currentStatus } = thresholdModal
    const newStatus = !currentStatus

    // Cerrar modal
    setThresholdModal({ open: false, ticketId: null, currentStatus: false, ticketInfo: null })

    try {
      await adminApi.updateTicketThreshold(ticketId, {
        exceeded_threshold: newStatus
      })

      toast({
        title: 'Actualizado',
        description: `Ticket ${newStatus ? 'marcado como vencido' : 'desmarcado como vencido'}`,
      })

      // Recargar datos
      await fetchTickets()
      await fetchMetrics()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al actualizar el ticket',
        variant: 'destructive'
      })
    }
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })

    const sorted = [...filteredTickets].sort((a, b) => {
      let aValue = a[key]
      let bValue = b[key]

      // Manejar valores numéricos
      if (key === 'response_time') {
        aValue = aValue || 0
        bValue = bValue || 0
      }

      // Manejar fechas
      if (key === 'created_at') {
        aValue = parseDate(aValue)?.getTime() || 0
        bValue = parseDate(bValue)?.getTime() || 0
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })

    setFilteredTickets(sorted)
  }

  const handleDeleteTicket = async (ticketId) => {
    if (!confirm('¿Estás seguro de eliminar este ticket? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      await adminApi.deleteTicket(ticketId)
      
      toast({
        title: 'Eliminado',
        description: 'Ticket eliminado correctamente',
      })
      
      // Recargar datos
      await fetchTickets()
      await fetchMetrics()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar el ticket',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    fetchMetrics()
    fetchTickets()
  }, [])

  // Aplicar filtros automáticamente cuando se cargan/actualizan los tickets
  // Esto asegura que:
  // 1. En carga inicial, los filtros predeterminados (365 días) se aplican inmediatamente
  // 2. Después de operaciones que actualizan tickets (ej: toggle threshold), los filtros se mantienen aplicados
  // Los cambios manuales de filtros requieren hacer clic en "Buscar" (comportamiento esperado por el usuario)
  useEffect(() => {
    if (tickets.length > 0) {
      applyFilters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets])

  // Función para parsear fecha en formato DD-MM-YYYY HH:MM:SS
  const parseDate = (dateStr) => {
    if (!dateStr) return null

    try {
      // Validar formato "DD-MM-YYYY HH:MM:SS"
      const parts = dateStr.trim().split(' ')
      if (parts.length < 1) {
        console.warn('Formato de fecha inválido:', dateStr)
        return null
      }

      const dateParts = parts[0].split('-')
      if (dateParts.length !== 3) {
        console.warn('Formato de fecha inválido:', dateStr)
        return null
      }

      const timeParts = parts[1]?.split(':') || ['00', '00', '00']

      // Convertir a formato ISO: YYYY-MM-DD
      const year = dateParts[2]
      const month = dateParts[1]
      const day = dateParts[0]

      const date = new Date(`${year}-${month}-${day}T${timeParts.join(':')}`)

      // Validar que la fecha sea válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida después de parsear:', dateStr)
        return null
      }

      return date
    } catch (error) {
      console.error('Error parseando fecha:', dateStr, error)
      return null
    }
  }

  // No aplicar filtros automáticamente, solo cuando se haga clic en buscar
  const applyFilters = () => {
    console.log('🔍 [DEBUG] Aplicando filtros:', filters)
    console.log('🔍 [DEBUG] Total tickets antes de filtrar:', tickets.length)

    let filtered = [...tickets]

    // Filtrar por fecha (manejar formato DD-MM-YYYY)
    if (filters.startDate) {
      const countBefore = filtered.length
      // Crear fecha de inicio a las 00:00:00
      const startDate = new Date(filters.startDate + 'T00:00:00')
      console.log('🔍 [DEBUG] Filtro fecha inicio:', filters.startDate, '→', startDate)

      // Mostrar ejemplos de fechas para diagnosticar
      if (filtered.length > 0) {
        console.log('🔍 [DEBUG] Primeros tickets con fechas (primeros 3):')
        filtered.slice(0, 3).forEach(t => {
          const parsed = parseDate(t.created_at)
          console.log(`  Ticket #${t.ticket_id}: "${t.created_at}" (tipo: ${typeof t.created_at}) → ${parsed ? parsed.toISOString() : 'NULL'}`)
        })
      }

      let failedParseCount = 0
      filtered = filtered.filter(t => {
        const ticketDate = parseDate(t.created_at)
        if (!ticketDate) {
          failedParseCount++
          if (failedParseCount <= 3) {
            console.warn('🔍 [DEBUG] Fecha no parseada:', t.created_at, '(tipo:', typeof t.created_at, ')')
          }
          return false
        }
        // Comparar solo la fecha (ignorar hora)
        const ticketDateOnly = new Date(ticketDate.getFullYear(), ticketDate.getMonth(), ticketDate.getDate())
        const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        return ticketDateOnly >= startDateOnly
      })
      if (failedParseCount > 0) {
        console.warn(`🔍 [DEBUG] Total fechas que no pudieron parsearse: ${failedParseCount}`)
      }
      console.log(`🔍 [DEBUG] Después de filtro fecha inicio: ${countBefore} → ${filtered.length}`)
    }
    if (filters.endDate) {
      const countBefore = filtered.length
      // Crear fecha de fin a las 23:59:59
      const endDate = new Date(filters.endDate + 'T23:59:59')
      console.log('🔍 [DEBUG] Filtro fecha fin:', filters.endDate, '→', endDate)

      filtered = filtered.filter(t => {
        const ticketDate = parseDate(t.created_at)
        if (!ticketDate) return false
        // Comparar solo la fecha (ignorar hora)
        const ticketDateOnly = new Date(ticketDate.getFullYear(), ticketDate.getMonth(), ticketDate.getDate())
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
        return ticketDateOnly <= endDateOnly
      })
      console.log(`🔍 [DEBUG] Después de filtro fecha fin: ${countBefore} → ${filtered.length}`)
    }

    // Filtrar por estado (usar is_closed y exceeded_threshold como fuente de verdad)
    if (filters.status === 'Abierto') {
      const countBefore = filtered.length
      console.log('🔍 [DEBUG] Aplicando filtro Abierto (is_closed=false, incluye vencidos)')

      // Mostrar valores de los primeros 3 tickets para diagnosticar
      if (filtered.length > 0) {
        console.log('🔍 [DEBUG] Valores de primeros 3 tickets:')
        filtered.slice(0, 3).forEach(t => {
          console.log(`  - Ticket #${t.ticket_id}: is_closed=${t.is_closed} (tipo: ${typeof t.is_closed}), exceeded_threshold=${t.exceeded_threshold} (tipo: ${typeof t.exceeded_threshold}), estado="${t.estado}"`)
        })
      }

      // Abierto: todos los tickets que NO están cerrados (incluye vencidos y no vencidos)
      filtered = filtered.filter(t => {
        const passes = t.is_closed === false
        return passes
      })
      console.log(`🔍 [DEBUG] Después de filtro Abierto: ${countBefore} → ${filtered.length}`)
    } else if (filters.status === 'Cerrado') {
      const countBefore = filtered.length
      console.log('🔍 [DEBUG] Aplicando filtro Cerrado (is_closed=true)')
      // Cerrado: marcado como cerrado (independiente de si excedió tiempo)
      filtered = filtered.filter(t => t.is_closed === true)
      console.log(`🔍 [DEBUG] Después de filtro Cerrado: ${countBefore} → ${filtered.length}`)
    } else if (filters.status === 'Vencido') {
      const countBefore = filtered.length
      console.log('🔍 [DEBUG] Aplicando filtro Vencido (exceeded_threshold=true && NO auditado)')
      // Vencido: excedió el tiempo de respuesta (abierto o cerrado) pero NO está auditado
      filtered = filtered.filter(t => {
        const isExpired = t.exceeded_threshold === true
        const isNotAudited = !t.audit_requested && !t.audit_status
        const passes = isExpired && isNotAudited

        if (!passes && countBefore <= 10) {
          console.log(`🔍 [DEBUG] Ticket ${t.ticket_id} rechazado: exceeded=${t.exceeded_threshold}, audit_requested=${t.audit_requested}, audit_status=${t.audit_status}`)
        }

        return passes
      })
      console.log(`🔍 [DEBUG] Después de filtro Vencido: ${countBefore} → ${filtered.length}`)
    } else if (filters.status === 'Auditado') {
      const countBefore = filtered.length
      console.log('🔍 [DEBUG] Aplicando filtro Auditado (audit_requested=true O audit_status!=null)')
      // Auditado: tickets que tienen auditoría solicitada o estado de auditoría
      filtered = filtered.filter(t => {
        const isAudited = t.audit_requested === true || t.audit_status !== null
        return isAudited
      })
      console.log(`🔍 [DEBUG] Después de filtro Auditado: ${countBefore} → ${filtered.length}`)
    }

    // Filtrar por operador
    if (filters.operator !== 'all') {
      const countBefore = filtered.length
      filtered = filtered.filter(t => t.assigned_to === parseInt(filters.operator))
      console.log(`🔍 [DEBUG] Después de filtro operador: ${countBefore} → ${filtered.length}`)
    }

    // Filtrar por prioridad
    if (filters.priority !== 'all') {
      const countBefore = filtered.length
      filtered = filtered.filter(t => t.prioridad === filters.priority)
      console.log(`🔍 [DEBUG] Después de filtro prioridad: ${countBefore} → ${filtered.length}`)
    }

    console.log('🔍 [DEBUG] ✅ Filtros aplicados. Total resultados:', filtered.length)
    if (filtered.length > 0 && filtered.length <= 5) {
      console.log('🔍 [DEBUG] Primeros resultados:', filtered.slice(0, 5))
    }

    setFilteredTickets(filtered)
  }

  const exportToCSV = () => {
    const headers = ['ID', 'Cliente', 'Asunto', 'Estado', 'Prioridad', 'Operador', 'Fecha', 'Tiempo Respuesta']
    const rows = filteredTickets.map(t => {
      const parsedDate = parseDate(t.created_at)
      const formattedDate = parsedDate ? parsedDate.toLocaleString() : t.created_at

      return [
        t.ticket_id,
        t.cliente,
        t.asunto,
        t.estado,
        t.prioridad,
        t.operator_name,
        formattedDate,
        t.response_time ? `${t.response_time} min` : 'N/A'
      ]
    })

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tickets_${filters.startDate}_${filters.endDate}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Calcular distribución por operador dinámicamente desde tickets filtrados
  const operatorDistribution = {}
  filteredTickets.forEach(ticket => {
    const operatorId = ticket.assigned_to
    const operatorName = ticket.operator_name
    
    if (!operatorDistribution[operatorId]) {
      operatorDistribution[operatorId] = {
        name: operatorName,
        person_id: operatorId,
        assigned: 0,
        completed: 0,
        exceeded_threshold: 0,
        sla_percentage: 0
      }
    }
    
    operatorDistribution[operatorId].assigned++
    if (ticket.is_closed === true) {
      operatorDistribution[operatorId].completed++
    }
    if (ticket.exceeded_threshold === true) {
      operatorDistribution[operatorId].exceeded_threshold++
    }
  })
  
  // Calcular SLA para cada operador
  Object.values(operatorDistribution).forEach(op => {
    if (op.assigned > 0) {
      const withinSLA = op.assigned - op.exceeded_threshold
      op.sla_percentage = ((withinSLA / op.assigned) * 100).toFixed(2)
    }
  })
  
  const operatorData = Object.values(operatorDistribution)
  
  // Calcular métricas dinámicamente basadas en tickets filtrados (usar is_closed como fuente de verdad)
  const filteredMetrics = {
    total: filteredTickets.length,
    open: filteredTickets.filter(t => t.is_closed === false).length,
    closed: filteredTickets.filter(t => t.is_closed === true).length,
    overdue: filteredTickets.filter(t => t.exceeded_threshold === true).length,
    avgResponseTime: filteredTickets.filter(t => t.response_time).length > 0 
      ? (filteredTickets.reduce((sum, t) => sum + (t.response_time || 0), 0) / filteredTickets.filter(t => t.response_time).length).toFixed(2)
      : 0
  }
  
  // Filtrar solo estados con valores > 0 para el gráfico (usar datos filtrados)
  const allStatusData = [
    { name: 'Cerrados', value: filteredMetrics.closed, color: '#00C49F' },
    { name: 'Abiertos', value: filteredMetrics.open, color: '#FF8042' },
    { name: 'Vencidos', value: filteredMetrics.overdue, color: '#FFBB28' }
  ]
  const statusData = allStatusData.filter(item => item.value > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métricas y Reportes</h1>
          <p className="text-muted-foreground">
            Análisis detallado de tickets y rendimiento del equipo
          </p>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="text-sm font-medium block mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Fecha Fin</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todos</option>
                <option value="Abierto">Abierto</option>
                <option value="Cerrado">Cerrado</option>
                <option value="Vencido">Vencido</option>
                <option value="Auditado">Auditado</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Operador</label>
              <select
                value={filters.operator}
                onChange={(e) => setFilters({ ...filters, operator: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todos</option>
                {metrics?.operator_distribution?.map(op => (
                  <option key={op.person_id} value={op.person_id}>{op.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Prioridad</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todas</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1" variant="default">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button onClick={exportToCSV} className="flex-1" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs - Usar métricas filtradas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredMetrics.total}</div>
            <p className="text-xs text-muted-foreground">
              En el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abiertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {filteredMetrics.open}
            </div>
            <p className="text-xs text-muted-foreground">
              Pendientes de asignación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Cerrados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredMetrics.closed}
            </div>
            <p className="text-xs text-muted-foreground">
              Resueltos exitosamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredMetrics.avgResponseTime} min
            </div>
            <p className="text-xs text-muted-foreground">
              Tiempo de respuesta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribución por Operador */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Operador</CardTitle>
            <CardDescription>Tickets asignados a cada operador</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={operatorData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="assigned" fill="#0088FE" name="Asignados" />
                <Bar dataKey="completed" fill="#00C49F" name="Completados" />
                <Bar dataKey="exceeded_threshold" fill="#FF8042" name="Vencidos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
            <CardDescription>Estado actual de los tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de SLA por Operador */}
      <Card>
        <CardHeader>
          <CardTitle>SLA por Operador</CardTitle>
          <CardDescription>
            Porcentaje de cumplimiento de tiempo de respuesta por operador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Operador</th>
                  <th className="text-left p-2 font-medium">Total Tickets</th>
                  <th className="text-left p-2 font-medium">Completados</th>
                  <th className="text-left p-2 font-medium">Vencidos</th>
                  <th className="text-left p-2 font-medium">SLA %</th>
                </tr>
              </thead>
              <tbody>
                {operatorData.map((operator) => (
                  <tr key={operator.person_id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{operator.name}</td>
                    <td className="p-2">{operator.assigned}</td>
                    <td className="p-2 text-green-600">{operator.completed}</td>
                    <td className="p-2 text-red-600">{operator.exceeded_threshold || 0}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              operator.sla_percentage >= 95 ? 'bg-green-500' :
                              operator.sla_percentage >= 85 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${operator.sla_percentage || 100}%` }}
                          />
                        </div>
                        <span className="font-semibold min-w-[60px]">
                          {operator.sla_percentage || 100}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Lista de Tickets ({filteredTickets.length})
          </CardTitle>
          <CardDescription>
            Tickets filtrados según los criterios seleccionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ticket_id')}>
                    <div className="flex items-center gap-1">
                      ID
                      {sortConfig.key === 'ticket_id' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-2 font-medium cursor-pointer hover:bg-gray-100" onClick={() => handleSort('cliente')}>
                    <div className="flex items-center gap-1">
                      Cliente
                      {sortConfig.key === 'cliente' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-2 font-medium">Asunto</th>
                  <th className="text-left p-2 font-medium cursor-pointer hover:bg-gray-100" onClick={() => handleSort('estado')}>
                    <div className="flex items-center gap-1">
                      Estado
                      {sortConfig.key === 'estado' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-2 font-medium cursor-pointer hover:bg-gray-100" onClick={() => handleSort('prioridad')}>
                    <div className="flex items-center gap-1">
                      Prioridad
                      {sortConfig.key === 'prioridad' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-2 font-medium cursor-pointer hover:bg-gray-100" onClick={() => handleSort('operator_name')}>
                    <div className="flex items-center gap-1">
                      Operador
                      {sortConfig.key === 'operator_name' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-2 font-medium cursor-pointer hover:bg-gray-100" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center gap-1">
                      Fecha
                      {sortConfig.key === 'created_at' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-2 font-medium cursor-pointer hover:bg-gray-100" onClick={() => handleSort('response_time')}>
                    <div className="flex items-center gap-1">
                      Tiempo
                      {sortConfig.key === 'response_time' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-2 font-medium cursor-pointer hover:bg-gray-100" onClick={() => handleSort('recreado')}>
                    <div className="flex items-center gap-1">
                      Recreado
                      {sortConfig.key === 'recreado' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="text-left p-2 font-medium">Vencido</th>
                  <th className="text-left p-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-xs">{ticket.ticket_id}</td>
                      <td className="p-2">{ticket.cliente}</td>
                      <td className="p-2 max-w-xs truncate">
                        <div className="flex flex-col gap-1">
                          <span className={ticket.recreado > 0 ? "text-red-600 font-semibold" : ""}>
                            {ticket.asunto}
                          </span>
                          {ticket.recreado > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🔄 Recreado x{ticket.recreado}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.estado === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                          ticket.estado === 'FAIL' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.estado}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.prioridad === 'high' ? 'bg-red-100 text-red-800' :
                          ticket.prioridad === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ticket.prioridad}
                        </span>
                      </td>
                      <td className="p-2">{ticket.operator_name || 'Sin asignar'}</td>
                      <td className="p-2 text-xs text-gray-600">
                        {ticket.created_at}
                      </td>
                      <td className="p-2 text-xs">
                        {ticket.response_time ? `${ticket.response_time} min` : 'N/A'}
                      </td>
                      <td className="p-2">
                        {ticket.recreado > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {ticket.recreado}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            0
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        {ticket.exceeded_threshold ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleThreshold(ticket.ticket_id, ticket.exceeded_threshold, ticket)}
                            className="h-7 px-2"
                            title={ticket.exceeded_threshold ? 'Marcar como NO vencido' : 'Marcar como vencido'}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTicket(ticket.ticket_id)}
                            className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar ticket"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-muted-foreground">
                      No hay tickets que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Información sobre Métricas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Las fechas se refieren al período de creación de los tickets</p>
          <p>• El tiempo promedio se calcula desde la creación hasta la primera respuesta</p>
          <p>• Los datos se actualizan en tiempo real</p>
          <p>• Puedes exportar los datos filtrados a CSV para análisis externo</p>
        </CardContent>
      </Card>

      {/* Modal de Confirmación para Marcar/Desmarcar Vencido */}
      <Dialog open={thresholdModal.open} onOpenChange={(open) => !open && setThresholdModal({ open: false, ticketId: null, currentStatus: false, ticketInfo: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {thresholdModal.currentStatus ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Desmarcar Ticket como Vencido</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span>Marcar Ticket como Vencido</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              {thresholdModal.ticketInfo && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Ticket:</span>
                    <span className="text-gray-900">#{thresholdModal.ticketInfo.ticket_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Cliente:</span>
                    <span className="text-gray-900">{thresholdModal.ticketInfo.cliente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Operador:</span>
                    <span className="text-gray-900">{thresholdModal.ticketInfo.operator_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Estado:</span>
                    <span className="text-gray-900">{thresholdModal.ticketInfo.estado}</span>
                  </div>
                </div>
              )}

              {thresholdModal.currentStatus ? (
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-800 mb-2">¿Estás seguro que deseas desmarcar este ticket como vencido?</p>
                  <p>Al confirmar, el indicador de <span className="font-semibold text-green-700">"Excede tiempo"</span> se establecerá en <span className="font-semibold text-green-700">NO</span> y el ticket dejará de aparecer en el filtro de vencidos.</p>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-800 mb-2">¿Estás seguro que deseas marcar este ticket como vencido?</p>
                  <p>Al confirmar, el indicador de <span className="font-semibold text-yellow-700">"Excede tiempo"</span> se establecerá en <span className="font-semibold text-yellow-700">SÍ</span> y se creará la métrica correspondiente si no existe.</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setThresholdModal({ open: false, ticketId: null, currentStatus: false, ticketInfo: null })}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={thresholdModal.currentStatus ? "default" : "destructive"}
              onClick={confirmToggleThreshold}
              className={thresholdModal.currentStatus ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {thresholdModal.currentStatus ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sí, Desmarcar
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Sí, Marcar como Vencido
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
