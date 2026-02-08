import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { logsApi, adminApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  RefreshCw,
  Search,
  Trash2,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Filter,
  Download,
  FileText,
  Activity,
  User,
  Terminal
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function UnifiedLogs() {
  // System Logs State
  const [systemLogs, setSystemLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [systemLoading, setSystemLoading] = useState(false)
  const [systemFilters, setSystemFilters] = useState({
    level: 'all',
    search: '',
    hours: 24,
    limit: 500
  })
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [filterAction, setFilterAction] = useState('')
  const [auditLimit, setAuditLimit] = useState(50)

  // Active Tab
  const [activeTab, setActiveTab] = useState('system')

  const { toast } = useToast()

  // System Logs Functions
  const fetchSystemLogs = useCallback(async () => {
    try {
      setSystemLoading(true)
      const response = await logsApi.getLogs(systemFilters)
      setSystemLogs(response.data.logs || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar logs del sistema',
        variant: 'destructive'
      })
    } finally {
      setSystemLoading(false)
    }
  }, [systemFilters, toast])

  const fetchStats = useCallback(async () => {
    try {
      const response = await logsApi.getStats({ hours: systemFilters.hours })
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [systemFilters.hours])

  const handleClearLogs = async () => {
    if (!confirm('¿Estás seguro de eliminar todos los logs del sistema? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      await logsApi.clearLogs()
      toast({
        title: 'Logs eliminados',
        description: 'Todos los logs del sistema han sido eliminados correctamente'
      })
      fetchSystemLogs()
      fetchStats()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar logs',
        variant: 'destructive'
      })
    }
  }

  const exportSystemLogs = () => {
    const headers = ['Timestamp', 'Level', 'Logger', 'Message']
    const rows = systemLogs.map(log => [
      log.timestamp,
      log.level,
      log.logger,
      log.message
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system_logs_${new Date().toISOString()}.csv`
    a.click()
  }

  // Audit Logs Functions
  const fetchAuditLogs = useCallback(async () => {
    try {
      setAuditLoading(true)
      const params = { limit: auditLimit }
      if (filterAction) {
        params.action = filterAction
      }
      const response = await adminApi.getAuditLogs(params)
      setAuditLogs(response.data.logs)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar logs de auditoría',
        variant: 'destructive'
      })
    } finally {
      setAuditLoading(false)
    }
  }, [auditLimit, filterAction, toast])

  // Combined Logs
  const combinedLogs = useMemo(() => {
    const system = systemLogs.map(log => ({
      ...log,
      type: 'system',
      timestamp: new Date(log.timestamp).getTime(),
      displayTime: log.timestamp
    }))

    const audit = auditLogs.map(log => ({
      ...log,
      type: 'audit',
      timestamp: new Date(log.performed_at).getTime(),
      displayTime: log.performed_at
    }))

    return [...system, ...audit].sort((a, b) => b.timestamp - a.timestamp)
  }, [systemLogs, auditLogs])

  // Effects
  useEffect(() => {
    if (activeTab === 'system') {
      fetchSystemLogs()
      fetchStats()
    } else if (activeTab === 'audit') {
      fetchAuditLogs()
    } else if (activeTab === 'combined') {
      fetchSystemLogs()
      fetchAuditLogs()
    }
  }, [activeTab, fetchSystemLogs, fetchStats, fetchAuditLogs])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchSystemLogs()
      fetchStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [autoRefresh, fetchSystemLogs, fetchStats])

  // Helper Functions
  const getLevelIcon = (level) => {
    switch (level) {
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-600" />
      case 'DEBUG':
        return <CheckCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getLevelBadge = (level) => {
    const variants = {
      ERROR: 'destructive',
      WARNING: 'warning',
      INFO: 'default',
      DEBUG: 'secondary'
    }
    return (
      <Badge variant={variants[level] || 'default'} className="font-mono text-xs">
        {level}
      </Badge>
    )
  }

  const getActionBadgeColor = (action) => {
    const colors = {
      'pause_operator': 'bg-orange-100 text-orange-800',
      'resume_operator': 'bg-green-100 text-green-800',
      'update_operator': 'bg-blue-100 text-blue-800',
      'reset_counters': 'bg-purple-100 text-purple-800',
      'update_config': 'bg-yellow-100 text-yellow-800',
      'create_schedule': 'bg-cyan-100 text-cyan-800',
      'update_schedule': 'bg-indigo-100 text-indigo-800',
      'delete_schedule': 'bg-red-100 text-red-800',
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  const getActionLabel = (action) => {
    const labels = {
      'pause_operator': 'Pausar Operador',
      'resume_operator': 'Reanudar Operador',
      'update_operator': 'Actualizar Operador',
      'reset_counters': 'Reiniciar Contadores',
      'update_config': 'Actualizar Config',
      'create_schedule': 'Crear Horario',
      'update_schedule': 'Actualizar Horario',
      'delete_schedule': 'Eliminar Horario',
      'create_operator': 'Crear Operador',
    }
    return labels[action] || action
  }

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs & Auditoría</h1>
          <p className="text-muted-foreground">
            Sistema de logs técnicos y registro de auditoría unificado
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'system' && (
            <>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </Button>
              <Button variant="outline" onClick={exportSystemLogs}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="destructive" onClick={handleClearLogs}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </>
          )}
          {activeTab === 'audit' && (
            <Button onClick={fetchAuditLogs} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          )}
          {activeTab === 'combined' && (
            <Button
              onClick={() => {
                fetchSystemLogs()
                fetchAuditLogs()
              }}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar Todo
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            System Logs
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Auditoría
          </TabsTrigger>
          <TabsTrigger value="combined" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Vista Combinada
          </TabsTrigger>
        </TabsList>

        {/* System Logs Tab */}
        <TabsContent value="system" className="space-y-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Últimas {systemFilters.hours}h</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Errores</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.by_level.ERROR || 0}</div>
                  <p className="text-xs text-muted-foreground">Requieren atención</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.by_level.WARNING || 0}</div>
                  <p className="text-xs text-muted-foreground">Advertencias</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Info</CardTitle>
                  <Info className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.by_level.INFO || 0}</div>
                  <p className="text-xs text-muted-foreground">Información</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Debug</CardTitle>
                  <CheckCircle className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{stats.by_level.DEBUG || 0}</div>
                  <p className="text-xs text-muted-foreground">Depuración</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nivel</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={systemFilters.level}
                    onChange={(e) => setSystemFilters({ ...systemFilters, level: e.target.value })}
                  >
                    <option value="all">Todos</option>
                    <option value="ERROR">ERROR</option>
                    <option value="WARNING">WARNING</option>
                    <option value="INFO">INFO</option>
                    <option value="DEBUG">DEBUG</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Período</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={systemFilters.hours}
                    onChange={(e) => setSystemFilters({ ...systemFilters, hours: parseInt(e.target.value) })}
                  >
                    <option value="1">Última hora</option>
                    <option value="6">Últimas 6 horas</option>
                    <option value="24">Últimas 24 horas</option>
                    <option value="72">Últimos 3 días</option>
                    <option value="168">Última semana</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Límite</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={systemFilters.limit}
                    onChange={(e) => setSystemFilters({ ...systemFilters, limit: parseInt(e.target.value) })}
                  >
                    <option value="100">100 logs</option>
                    <option value="500">500 logs</option>
                    <option value="1000">1000 logs</option>
                    <option value="5000">5000 logs</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar en logs..."
                      value={systemFilters.search}
                      onChange={(e) => setSystemFilters({ ...systemFilters, search: e.target.value })}
                    />
                    <Button onClick={fetchSystemLogs}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Logs List */}
          <Card>
            <CardHeader>
              <CardTitle>Logs del Sistema ({systemLogs.length})</CardTitle>
              <CardDescription>
                Mostrando los últimos {systemLogs.length} logs técnicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : systemLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron logs con los filtros aplicados</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {systemLogs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getLevelIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getLevelBadge(log.level)}
                          <span className="text-xs text-muted-foreground font-mono">
                            {log.timestamp}
                          </span>
                          <Badge variant="outline" className="text-xs font-mono">
                            {log.logger}
                          </Badge>
                        </div>
                        <p className="text-sm break-words font-mono">{log.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Acción</label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Todas las acciones</option>
                    {uniqueActions.map(action => (
                      <option key={action} value={action}>
                        {getActionLabel(action)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="text-sm font-medium mb-2 block">Límite</label>
                  <select
                    value={auditLimit}
                    onChange={(e) => setAuditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="200">200</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Registros de Auditoría ({auditLogs.length})
              </CardTitle>
              <CardDescription>
                Últimas {auditLimit} acciones registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : auditLogs.length > 0 ? (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                              {getActionLabel(log.action)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {log.entity_type && `• ${log.entity_type}`}
                              {log.entity_id && ` #${log.entity_id}`}
                            </span>
                          </div>

                          {log.notes && (
                            <p className="text-sm text-gray-700">{log.notes}</p>
                          )}

                          {(log.old_value || log.new_value) && (
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              {log.old_value && (
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-600">Valor Anterior:</div>
                                  <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(log.old_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_value && (
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-600">Valor Nuevo:</div>
                                  <pre className="bg-green-50 p-2 rounded overflow-x-auto">
                                    {JSON.stringify(log.new_value, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>👤 {log.performed_by || 'Sistema'}</span>
                            {log.ip_address && <span>🌐 {log.ip_address}</span>}
                            <span>🕐 {new Date(log.performed_at).toLocaleString('es-AR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No hay registros de auditoría disponibles
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Sobre el Registro de Auditoría</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 space-y-2">
              <p>• Todos los cambios en el sistema quedan registrados automáticamente</p>
              <p>• Los registros incluyen quién realizó la acción y desde qué IP</p>
              <p>• Se guardan los valores anteriores y nuevos para trazabilidad completa</p>
              <p>• Los registros son permanentes y no se pueden eliminar</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Combined View Tab */}
        <TabsContent value="combined" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Timeline Unificada ({combinedLogs.length} registros)
              </CardTitle>
              <CardDescription>
                Vista cronológica combinada de logs del sistema y auditoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemLoading || auditLoading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : combinedLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay registros disponibles</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {combinedLogs.map((log, index) => (
                    <div
                      key={`${log.type}-${index}`}
                      className="p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      {log.type === 'system' ? (
                        // System Log
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getLevelIcon(log.level)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                <Terminal className="h-3 w-3 mr-1" />
                                Sistema
                              </Badge>
                              {getLevelBadge(log.level)}
                              <span className="text-xs text-muted-foreground font-mono">
                                {log.displayTime}
                              </span>
                              <Badge variant="outline" className="text-xs font-mono">
                                {log.logger}
                              </Badge>
                            </div>
                            <p className="text-sm break-words font-mono">{log.message}</p>
                          </div>
                        </div>
                      ) : (
                        // Audit Log
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              Auditoría
                            </Badge>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                              {getActionLabel(log.action)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {log.entity_type && `• ${log.entity_type}`}
                              {log.entity_id && ` #${log.entity_id}`}
                            </span>
                          </div>

                          {log.notes && (
                            <p className="text-sm text-gray-700">{log.notes}</p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>👤 {log.performed_by || 'Sistema'}</span>
                            {log.ip_address && <span>🌐 {log.ip_address}</span>}
                            <span>🕐 {new Date(log.displayTime).toLocaleString('es-AR')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Leyenda</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Terminal className="h-3 w-3 mr-1" />
                  Sistema
                </Badge>
                <span className="text-muted-foreground">Logs técnicos del sistema</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  Auditoría
                </Badge>
                <span className="text-muted-foreground">Acciones de usuarios</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
