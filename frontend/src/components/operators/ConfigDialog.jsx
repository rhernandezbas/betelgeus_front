import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pause, UserX, Bell, BellOff, Save, X } from 'lucide-react'

export function ConfigDialog({ operator, open, onOpenChange, configForm, onConfigChange, onSave }) {
  if (!operator) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración de {operator.name}</DialogTitle>
          <DialogDescription>
            Gestiona pausas y configuración del operador
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Número de WhatsApp */}
          <div>
            <Label htmlFor="config-whatsapp">Número de WhatsApp</Label>
            <Input
              id="config-whatsapp"
              type="tel"
              value={configForm.whatsapp_number}
              onChange={(e) => onConfigChange({ ...configForm, whatsapp_number: e.target.value })}
              placeholder="+54 9 11 1234-5678"
            />
          </div>

          {/* Pausa Total */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-orange-500" />
              <div>
                <p className="font-medium">Pausar Todo</p>
                <p className="text-xs text-gray-500">Sin asignación ni notificaciones</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={configForm.is_paused}
              onChange={(e) => onConfigChange({ ...configForm, is_paused: e.target.checked })}
              className="w-4 h-4"
            />
          </div>

          {/* Razón de Pausa */}
          {configForm.is_paused && (
            <div>
              <Label htmlFor="paused-reason">Razón de la pausa</Label>
              <Input
                id="paused-reason"
                value={configForm.paused_reason}
                onChange={(e) => onConfigChange({ ...configForm, paused_reason: e.target.value })}
                placeholder="Ej: no asignar de momento"
              />
            </div>
          )}

          {/* Pausa de Asignación */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-blue-500" />
              <div>
                <p className="font-medium">Pausar Asignación</p>
                <p className="text-xs text-gray-500">No recibe tickets nuevos</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={configForm.assignment_paused}
              onChange={(e) => onConfigChange({ ...configForm, assignment_paused: e.target.checked })}
              className="w-4 h-4"
              disabled={configForm.is_paused}
            />
          </div>

          {/* Notificaciones */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              {configForm.notifications_enabled ? (
                <Bell className="h-4 w-4 text-green-500" />
              ) : (
                <BellOff className="h-4 w-4 text-gray-400" />
              )}
              <div>
                <p className="font-medium">Notificaciones</p>
                <p className="text-xs text-gray-500">Alertas de WhatsApp</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={configForm.notifications_enabled}
              onChange={(e) => onConfigChange({ ...configForm, notifications_enabled: e.target.checked })}
              className="w-4 h-4"
              disabled={configForm.is_paused}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
