import { Button } from '@/components/ui/button'
import { Edit2, Trash2, Save, X } from 'lucide-react'

const daysOfWeek = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' }
]

export function ScheduleList({
  groupedSchedules,
  editingSchedule,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onEditingChange
}) {
  return (
    <div className="space-y-3">
      {daysOfWeek.map(day => {
        const daySchedules = groupedSchedules[day.value] || []
        if (daySchedules.length === 0) return null

        return (
          <div key={day.value} className="border-b pb-3 last:border-0">
            <h4 className="font-medium text-sm mb-2">{day.label}</h4>
            <div className="space-y-2">
              {daySchedules.map(schedule => (
                <div key={schedule.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  {editingSchedule?.id === schedule.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={editingSchedule.start_time}
                        onChange={(e) => onEditingChange({ ...editingSchedule, start_time: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={editingSchedule.end_time}
                        onChange={(e) => onEditingChange({ ...editingSchedule, end_time: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      />
                      <Button onClick={onSave} size="sm" variant="default">
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button onClick={onCancelEdit} size="sm" variant="outline">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm">
                        {schedule.start_time} - {schedule.end_time}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => onEdit(schedule)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => onDelete(schedule.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {Object.keys(groupedSchedules).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay horarios configurados
        </div>
      )}
    </div>
  )
}
