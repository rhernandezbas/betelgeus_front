import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { adminApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, ArrowRightLeft, Filter, Search, User, Check, X } from 'lucide-react'

const getTypeBadge = (type) => {
  const config = {
    'splynx_sync': { label: 'Splynx Sync', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    'manual': { label: 'Manual', className: 'bg-green-100 text-green-800 border-green-200' },
    'auto_unassign': { label: 'Auto Desasignar', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    'end_of_shift': { label: 'Fin de Turno', className: 'bg-red-100 text-red-800 border-red-200' },
  }
  const c = config[type] || { label: type || 'Desconocido', className: 'bg-gray-100 text-gray-800 border-gray-200' }
  return <Badge className={c.className}>{c.label}</Badge>
}

const getNotificationBadge = (sent) => {
  if (sent) {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <Check className="h-3 w-3 mr-1" />
        Enviada
      </Badge>
    )
  }
  return (
    <Badge className="bg-gray-100 text-gray-500 border-gray-200">
      <X className="h-3 w-3 mr-1" />
      No enviada
    </Badge>
  )
}

export default function ReassignmentHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTicketId, setFilterTicketId] = useState('')
  const [filterType, setFilterType] = useState('')
  const [limit, setLimit] = useState(100)
  const { toast } = useToast()

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      const params = { limit }
      if (filterTicketId) {
        params.ticket_id = filterTicketId
      }
      const response = await adminApi.getReassignmentHistory(params)
      setHistory(response.data.history || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar historial de reasignaciones',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [limit, filterTicketId, toast])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const handleSearch = () => {
    fetchHistory()
  }

  const handleClearFilters = () => {
    setFilterTicketId('')
    setFilterType('')
    setTimeout(() => fetchHistory(), 100)
  }

  const filteredHistory = filterType
    ? history.filter((item) => item.reassignment_type === filterType)
    : history

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Reasignaciones</h1>
          <p className="text-muted-foreground">
            Registro completo de movimientos de tickets entre operadores
          </p>
        </div>
        <Button onClick={fetchHistory} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

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
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Todos</option>
                <option value="manual">Manual</option>
                <option value="splynx_sync">Splynx Sync</option>
                <option value="auto_unassign">Auto Desasignar</option>
                <option value="end_of_shift">Fin de Turno</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Ticket ID</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: 3300"
                  value={filterTicketId}
                  onChange={(e) => setFilterTicketId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className="w-32">
              <label className="text-sm font-medium mb-2 block">Limite</label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="500">500</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button onClick={handleClearFilters} variant="outline" size="sm">
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Registros ({filteredHistory.length})
          </CardTitle>
          <CardDescription>
            Ultimas {limit} reasignaciones registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Ticket</th>
                    <th className="text-left p-3 font-medium">De (Operador)</th>
                    <th className="text-left p-3 font-medium">A (Operador)</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Razon</th>
                    <th className="text-left p-3 font-medium">Notificacion</th>
                    <th className="text-left p-3 font-medium">Creado por</th>
                    <th className="text-left p-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-semibold">#{item.ticket_id}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-red-500" />
                          <span>{item.from_operator_name || item.from_operator_id || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-500" />
                          <span>{item.to_operator_name || item.to_operator_id || '-'}</span>
                        </div>
                      </td>
                      <td className="p-3">{getTypeBadge(item.reassignment_type)}</td>
                      <td className="p-3 max-w-[200px]">
                        {item.reason ? (
                          <span className="text-gray-600 truncate block" title={item.reason}>
                            {item.reason}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-3">{getNotificationBadge(item.notification_sent)}</td>
                      <td className="p-3 text-gray-600">{item.created_by || 'Sistema'}</td>
                      <td className="p-3 text-gray-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No hay registros de reasignaciones disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Sobre el Historial de Reasignaciones</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>Registra todos los movimientos de tickets entre operadores</p>
          <p>Incluye reasignaciones automaticas por fin de turno y sincronizacion con Splynx</p>
          <p>Los operadores reciben notificaciones de WhatsApp cuando sus tickets son reasignados</p>
          <p>Puedes filtrar por ticket especifico o por tipo de reasignacion</p>
        </CardContent>
      </Card>
    </div>
  )
}
