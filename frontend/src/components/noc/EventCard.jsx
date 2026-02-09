import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  XCircle,
  AlertTriangle,
  Info,
  MessageSquare,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Severity config
const severityConfig = {
  critical: { color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', icon: XCircle },
  high: { color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50', icon: AlertCircle },
  medium: { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', icon: AlertTriangle },
  low: { color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', icon: Info },
  info: { color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50', icon: Info }
}

// Status config
const statusConfig = {
  active: { color: 'destructive', label: 'Activo' },
  acknowledged: { color: 'warning', label: 'Reconocido' },
  resolved: { color: 'default', label: 'Resuelto' },
  ignored: { color: 'secondary', label: 'Ignorado' }
}

// Event type labels
const eventTypeLabels = {
  site_outage: 'Caída de Site',
  site_degraded: 'Site Degradado',
  site_recovered: 'Site Recuperado',
  device_outage: 'Dispositivo Caído',
  custom: 'Evento Manual'
}

// Time ago helper
const timeAgo = (date) => {
  if (!date) return ''
  const now = new Date()
  const then = new Date(date)
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
  if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
  if (diffMins > 0) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`
  return 'hace un momento'
}

export default function EventCard({
  event,
  onAcknowledge,
  onResolve,
  onDelete,
  onCreatePostMortem,
  onWhatsApp,
  compact = false
}) {
  const [expanded, setExpanded] = useState(false)
  const [acknowledgeDialogOpen, setAcknowledgeDialogOpen] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [whatsappType, setWhatsappType] = useState('complete')
  const [formData, setFormData] = useState({ by: '', note: '' })
  const [loading, setLoading] = useState(false)

  const severity = severityConfig[event.severity] || severityConfig.info
  const status = statusConfig[event.status] || statusConfig.active
  const SeverityIcon = severity.icon

  const handleAcknowledge = async () => {
    setLoading(true)
    try {
      await onAcknowledge?.(event.id, {
        acknowledged_by: formData.by,
        note: formData.note
      })
      setAcknowledgeDialogOpen(false)
      setFormData({ by: '', note: '' })
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    setLoading(true)
    try {
      await onResolve?.(event.id, {
        resolved_by: formData.by,
        note: formData.note
      })
      setResolveDialogOpen(false)
      setFormData({ by: '', note: '' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await onDelete?.(event.id)
      setDeleteDialogOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = async () => {
    setLoading(true)
    try {
      await onWhatsApp?.(whatsappType, event.id)
      setWhatsappDialogOpen(false)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <div className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        severity.bgColor
      )}>
        <div className="flex items-center gap-3">
          <SeverityIcon className={cn('h-5 w-5', severity.textColor)} />
          <div>
            <p className="font-medium text-sm">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {eventTypeLabels[event.event_type] || event.event_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.color}>{status.label}</Badge>
          <span className="text-xs text-muted-foreground">
            {timeAgo(event.created_at)}
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className={cn(
        'transition-all',
        event.status === 'active' && 'border-red-300',
        event.status === 'acknowledged' && 'border-yellow-300'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={cn('p-2 rounded-full', severity.bgColor)}>
                <SeverityIcon className={cn('h-5 w-5', severity.textColor)} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">#{event.id}</span>
                  <Badge variant={status.color}>{status.label}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {eventTypeLabels[event.event_type] || event.event_type}
                  </Badge>
                </div>
                <h3 className="font-semibold">{event.title}</h3>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeAgo(event.created_at)}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          {event.description && (
            <p className="text-sm text-muted-foreground">
              {event.description}
            </p>
          )}

          {/* Expand/Collapse for custom data */}
          {event.custom_data && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full justify-between"
              >
                <span className="text-xs">Datos adicionales</span>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {expanded && (
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(event.custom_data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2 text-xs border-l-2 pl-4 ml-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 -ml-[21px]" />
              <span className="text-muted-foreground">Creado</span>
              <span>{new Date(event.created_at).toLocaleString('es-AR')}</span>
            </div>

            {event.acknowledged_at && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 -ml-[21px]" />
                <span className="text-muted-foreground">Reconocido por {event.acknowledged_by}</span>
                <span>{new Date(event.acknowledged_at).toLocaleString('es-AR')}</span>
              </div>
            )}

            {event.resolved_at && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 -ml-[21px]" />
                <span className="text-muted-foreground">Resuelto por {event.resolved_by}</span>
                <span>{new Date(event.resolved_at).toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            {event.status === 'active' && (
              <Button
                size="sm"
                onClick={() => setAcknowledgeDialogOpen(true)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Reconocer
              </Button>
            )}

            {(event.status === 'active' || event.status === 'acknowledged') && (
              <Button
                size="sm"
                onClick={() => setResolveDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Resolver
              </Button>
            )}

            {(event.status === 'acknowledged' || event.status === 'resolved') && onCreatePostMortem && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCreatePostMortem?.(event)}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <FileText className="h-4 w-4 mr-1" />
                Post-Mortem
              </Button>
            )}

            {onWhatsApp && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setWhatsappDialogOpen(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Acknowledge Dialog */}
      <Dialog open={acknowledgeDialogOpen} onOpenChange={setAcknowledgeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reconocer Evento</DialogTitle>
            <DialogDescription>
              Indica quién está atendiendo este evento y agrega una nota opcional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ack-by">Reconocido por *</Label>
              <Input
                id="ack-by"
                placeholder="Tu nombre"
                value={formData.by}
                onChange={(e) => setFormData({ ...formData, by: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ack-note">Nota (opcional)</Label>
              <Textarea
                id="ack-note"
                placeholder="Ej: Técnico en camino, ETA 30 minutos"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAcknowledgeDialogOpen(false)
              setFormData({ by: '', note: '' })
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleAcknowledge}
              disabled={!formData.by || loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {loading ? 'Guardando...' : 'Reconocer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Evento</DialogTitle>
            <DialogDescription>
              Marca este evento como resuelto e indica quién lo resolvió.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="res-by">Resuelto por *</Label>
              <Input
                id="res-by"
                placeholder="Tu nombre"
                value={formData.by}
                onChange={(e) => setFormData({ ...formData, by: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-note">Nota de resolución</Label>
              <Textarea
                id="res-note"
                placeholder="Ej: Fibra restaurada, todos los dispositivos online"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setResolveDialogOpen(false)
              setFormData({ by: '', note: '' })
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!formData.by || loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Guardando...' : 'Resolver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Evento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Notificación WhatsApp</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de mensaje a enviar al número configurado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Tipo de Mensaje</Label>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    id="whatsapp-complete"
                    name="whatsapp-type"
                    value="complete"
                    checked={whatsappType === 'complete'}
                    onChange={(e) => setWhatsappType(e.target.value)}
                    className="mt-1"
                  />
                  <label htmlFor="whatsapp-complete" className="cursor-pointer flex-1">
                    <div className="font-medium">Completo</div>
                    <div className="text-sm text-muted-foreground">
                      Incluye todos los detalles del evento
                    </div>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    id="whatsapp-summary"
                    name="whatsapp-type"
                    value="summary"
                    checked={whatsappType === 'summary'}
                    onChange={(e) => setWhatsappType(e.target.value)}
                    className="mt-1"
                  />
                  <label htmlFor="whatsapp-summary" className="cursor-pointer flex-1">
                    <div className="font-medium">Resumen</div>
                    <div className="text-sm text-muted-foreground">
                      Resumen breve del evento
                    </div>
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    id="whatsapp-recovery"
                    name="whatsapp-type"
                    value="recovery"
                    checked={whatsappType === 'recovery'}
                    onChange={(e) => setWhatsappType(e.target.value)}
                    className="mt-1"
                  />
                  <label htmlFor="whatsapp-recovery" className="cursor-pointer flex-1">
                    <div className="font-medium">Recuperación</div>
                    <div className="text-sm text-muted-foreground">
                      Notificación de recuperación del servicio
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  El mensaje se enviará al número configurado en el sistema.
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setWhatsappDialogOpen(false)
              setWhatsappType('complete')
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleWhatsApp}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-1" />
              {loading ? 'Enviando...' : 'Enviar WhatsApp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
