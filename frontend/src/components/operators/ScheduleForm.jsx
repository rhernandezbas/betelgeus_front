import { Button } from '@/components/ui/button'
import { Save, X } from 'lucide-react'

const daysOfWeek = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' }
]

export function ScheduleForm({ schedule, scheduleType, onChange, onSave, onCancel }) {
  const getScheduleTypeClass = () => {
    switch (scheduleType) {
      case 'work':
        return 'border-green-200 bg-green-50'
      case 'assignment':
        return 'border-blue-200 bg-blue-50'
      case 'alert':
        return 'border-orange-200 bg-orange-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getScheduleTypeTextClass = () => {
    switch (scheduleType) {
      case 'work':
        return 'text-green-900'
      case 'assignment':
        return 'text-blue-900'
      case 'alert':
        return 'text-orange-900'
      default:
        return 'text-gray-900'
    }
  }

  const getScheduleTypeLabel = () => {
    switch (scheduleType) {
      case 'work':
        return 'Trabajo'
      case 'assignment':
        return 'Asignación'
      case 'alert':
        return 'Alertas'
      default:
        return 'Horario'
    }
  }

  return (
    <div className={`mb-4 p-4 border-2 rounded-lg ${getScheduleTypeClass()}`}>
      <h4 className={`font-medium mb-3 ${getScheduleTypeTextClass()}`}>
        Nuevo Horario de {getScheduleTypeLabel()}
      </h4>
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">Día</label>
          <select
            value={schedule.day_of_week}
            onChange={(e) => onChange({ ...schedule, day_of_week: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            {daysOfWeek.map(day => (
              <option key={day.value} value={day.value}>{day.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Inicio</label>
          <input
            type="time"
            value={schedule.start_time}
            onChange={(e) => onChange({ ...schedule, start_time: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Fin</label>
          <input
            type="time"
            value={schedule.end_time}
            onChange={(e) => onChange({ ...schedule, end_time: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={onSave} size="sm" className="flex-1">
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
