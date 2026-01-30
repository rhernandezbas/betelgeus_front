import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, ArrowRightLeft, Filter, Search, User } from 'lucide-react'

export default function ReassignmentHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterTicketId, setFilterTicketId] = useState('')
  const [filterOperatorId, setFilterOperatorId] = useState('')
  const [limit, setLimit] = useState(100)
  const { toast } = useToast()

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const params = { limit }
      if (filterTicketId) {
        params.ticket_id = filterTicketId
      }
      if (filterOperatorId) {
        params.operator_id = filterOperatorId
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
  }

  useEffect(() => {
    fetchHistory()
  }, [limit])

  const handleSearch = () => {
    fetchHistory()
  }

  const handleClearFilters = () => {
    setFilterTicketId('')
    setFilterOperatorId('')
    setTimeout(() => fetchHistory(), 100)
  }

  const getTypeBadgeColor = (type) => {
    const colors = {
      'auto_unassign_after_shift': 'bg-orange-100 text-orange-800',
      'manual': 'bg-blue-100 text-blue-800',
      'end_of_shift': 'bg-purple-100 text-purple-800',
      'system': 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getTypeLabel = (type) => {
    const labels = {
      'auto_unassign_after_shift': 'Desasignación Automática',
      'manual': 'Manual',
      'end_of_shift': 'Fin de Turno',
      'system': 'Sistema',
    }
    return labels[type] || type
  }

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
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Operador ID</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: 123"
                  value={filterOperatorId}
                  onChange={(e) => setFilterOperatorId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <div className="w-32">
              <label className="text-sm font-medium mb-2 block">Límite</label>
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

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Registros ({history.length})
          </CardTitle>
          <CardDescription>
            Últimas {limit} reasignaciones registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Header with type badge and ticket */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(item.reassignment_type)}`}>
                          {getTypeLabel(item.reassignment_type)}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          Ticket #{item.ticket_id}
                        </span>
                      </div>
                      
                      {/* From -> To */}
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded">
                          <User className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-red-700">
                            {item.from_operator_name}
                            {item.from_operator_id && (
                              <span className="text-xs text-red-500 ml-1">
                                (ID: {item.from_operator_id})
                              </span>
                            )}
                          </span>
                        </div>
                        
                        <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                        
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded">
                          <User className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">
                            {item.to_operator_name}
                            {item.to_operator_id && (
                              <span className="text-xs text-green-500 ml-1">
                                (ID: {item.to_operator_id})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {/* Reason */}
                      {item.reason && (
                        <p className="text-sm text-gray-600 italic">
                          💬 {item.reason}
                        </p>
                      )}
                      
                      {/* Footer with metadata */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>👤 {item.created_by || 'Sistema'}</span>
                        <span>🕐 {new Date(item.created_at).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
          <p>• 🔄 Registra todos los movimientos de tickets entre operadores</p>
          <p>• 🤖 Incluye reasignaciones automáticas por fin de turno</p>
          <p>• 📱 Los operadores reciben notificaciones de WhatsApp cuando sus tickets son reasignados</p>
          <p>• 🔍 Puedes filtrar por ticket específico o por operador</p>
          <p>• 📊 Útil para auditoría y análisis de flujo de trabajo</p>
        </CardContent>
      </Card>
    </div>
  )
}
