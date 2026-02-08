import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Edit2, Play, Pause, UserCheck, UserX, Briefcase } from 'lucide-react'

export function OperatorCard({
  operator,
  onConfig,
  onPause,
  onResume,
  onEdit,
  onToggleActive
}) {
  return (
    <Card className={operator.is_paused ? 'border-orange-300' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 flex-wrap">
              {operator.name}
              {operator.is_paused && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  🔴 Pausado Total
                </span>
              )}
              {!operator.is_paused && operator.assignment_paused && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🚫 Sin Asignación
                </span>
              )}
              {!operator.notifications_enabled && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  🔕 Sin Notif.
                </span>
              )}
              {!operator.is_active && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  ❌ Inactivo
                </span>
              )}
            </CardTitle>
            <CardDescription>
              ID: {operator.person_id} • WhatsApp: {operator.whatsapp_number || 'No configurado'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{operator.ticket_count}</div>
            <div className="text-xs text-muted-foreground">Asignados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {operator.schedules?.filter(s => s.schedule_type === 'work').length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Horarios</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {operator.notifications_enabled ? (
                <Bell className="h-6 w-6 mx-auto" />
              ) : (
                <BellOff className="h-6 w-6 mx-auto" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">Notif.</div>
          </div>
        </div>

        {/* Pause Reason */}
        {operator.is_paused && operator.paused_reason && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-sm text-orange-800">
              <strong>Razón:</strong> {operator.paused_reason}
            </p>
            {operator.paused_at && (
              <p className="text-xs text-orange-600 mt-1">
                Pausado: {new Date(operator.paused_at).toLocaleString('es-AR')}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            onClick={() => onConfig(operator)}
            size="sm"
            variant="outline"
            className="flex-1"
            title="Configuración completa"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Configurar
          </Button>

          {operator.is_paused ? (
            <Button
              onClick={() => onResume(operator.person_id, operator.name)}
              size="sm"
              variant="default"
            >
              <Play className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => onPause(operator.person_id, operator.name)}
              size="sm"
              variant="outline"
            >
              <Pause className="h-4 w-4" />
            </Button>
          )}

          <Button
            onClick={() => onEdit(operator)}
            size="sm"
            variant="outline"
            title="Editar horarios"
          >
            <Edit2 className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => onToggleActive(operator.person_id, operator.name, operator.is_active)}
            size="sm"
            variant={operator.is_active ? "destructive" : "default"}
            title={operator.is_active ? 'Desactivar' : 'Activar'}
          >
            {operator.is_active ? (
              <UserX className="h-4 w-4" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
