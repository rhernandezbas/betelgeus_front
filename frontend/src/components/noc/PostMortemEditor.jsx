import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Save,
  CheckCircle,
  Clock,
  User,
  AlertTriangle,
  FileText,
  ArrowLeft
} from 'lucide-react'

export default function PostMortemEditor({
  postMortem = null,
  event = null,
  onSave,
  onComplete,
  onCancel,
  loading = false
}) {
  const [formData, setFormData] = useState({
    alert_event_id: event?.id || postMortem?.alert_event_id || '',
    title: postMortem?.title || (event ? `Post-Mortem: ${event.title}` : ''),
    summary: postMortem?.summary || '',
    root_cause: postMortem?.root_cause || '',
    author: postMortem?.author || '',
    lessons_learned: postMortem?.lessons_learned || '',
    timeline_events: postMortem?.timeline_events || [],
    preventive_actions: postMortem?.preventive_actions || [],
    action_items: postMortem?.action_items || []
  })

  // Add timeline event
  const addTimelineEvent = () => {
    setFormData(prev => ({
      ...prev,
      timeline_events: [
        ...prev.timeline_events,
        { time: '', event: '', actor: '' }
      ]
    }))
  }

  const updateTimelineEvent = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      timeline_events: prev.timeline_events.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeTimelineEvent = (index) => {
    setFormData(prev => ({
      ...prev,
      timeline_events: prev.timeline_events.filter((_, i) => i !== index)
    }))
  }

  // Add preventive action
  const addPreventiveAction = () => {
    setFormData(prev => ({
      ...prev,
      preventive_actions: [
        ...prev.preventive_actions,
        { action: '', owner: '', priority: 'medium', due_date: '' }
      ]
    }))
  }

  const updatePreventiveAction = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      preventive_actions: prev.preventive_actions.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removePreventiveAction = (index) => {
    setFormData(prev => ({
      ...prev,
      preventive_actions: prev.preventive_actions.filter((_, i) => i !== index)
    }))
  }

  // Add action item
  const addActionItem = () => {
    setFormData(prev => ({
      ...prev,
      action_items: [
        ...prev.action_items,
        { item: '', owner: '', status: 'pending' }
      ]
    }))
  }

  const updateActionItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeActionItem = (index) => {
    setFormData(prev => ({
      ...prev,
      action_items: prev.action_items.filter((_, i) => i !== index)
    }))
  }

  const handleSave = () => {
    onSave?.(formData)
  }

  const handleComplete = () => {
    onComplete?.(formData)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-xl font-bold">
              {postMortem ? 'Editar Post-Mortem' : 'Nuevo Post-Mortem'}
            </h2>
            {event && (
              <p className="text-sm text-muted-foreground">
                Basado en evento #{event.id}: {event.title}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Borrador
          </Button>
          <Button onClick={handleComplete} disabled={loading} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completar
          </Button>
        </div>
      </div>

      {/* Basic Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Caída masiva Nodo Estudiantes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Autor *</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Tu nombre"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Resumen Ejecutivo *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Describe brevemente qué pasó, el impacto y la resolución"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="root_cause">Causa Raíz *</Label>
            <Textarea
              id="root_cause"
              value={formData.root_cause}
              onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
              placeholder="¿Qué causó el incidente?"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline de Eventos
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addTimelineEvent}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar Evento
            </Button>
          </div>
          <CardDescription>
            Registra cronológicamente los eventos durante el incidente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.timeline_events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay eventos en el timeline</p>
              <Button size="sm" variant="link" onClick={addTimelineEvent}>
                Agregar primer evento
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.timeline_events.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50">
                  <div className="flex-shrink-0 w-20">
                    <Input
                      placeholder="HH:MM"
                      value={item.time}
                      onChange={(e) => updateTimelineEvent(index, 'time', e.target.value)}
                      className="text-center font-mono"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="¿Qué ocurrió?"
                      value={item.event}
                      onChange={(e) => updateTimelineEvent(index, 'event', e.target.value)}
                      className="mb-2"
                    />
                    <Input
                      placeholder="¿Quién lo hizo/detectó?"
                      value={item.actor}
                      onChange={(e) => updateTimelineEvent(index, 'actor', e.target.value)}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTimelineEvent(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preventive Actions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Acciones Preventivas
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addPreventiveAction}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar Acción
            </Button>
          </div>
          <CardDescription>
            ¿Qué se puede hacer para evitar que esto vuelva a pasar?
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.preventive_actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay acciones preventivas definidas</p>
              <Button size="sm" variant="link" onClick={addPreventiveAction}>
                Agregar primera acción
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.preventive_actions.map((item, index) => (
                <div key={index} className="p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Describe la acción preventiva"
                        value={item.action}
                        onChange={(e) => updatePreventiveAction(index, 'action', e.target.value)}
                        rows={2}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Responsable"
                          value={item.owner}
                          onChange={(e) => updatePreventiveAction(index, 'owner', e.target.value)}
                        />
                        <select
                          className="px-3 py-2 border rounded-md text-sm"
                          value={item.priority}
                          onChange={(e) => updatePreventiveAction(index, 'priority', e.target.value)}
                        >
                          <option value="high">Prioridad Alta</option>
                          <option value="medium">Prioridad Media</option>
                          <option value="low">Prioridad Baja</option>
                        </select>
                        <Input
                          type="date"
                          value={item.due_date}
                          onChange={(e) => updatePreventiveAction(index, 'due_date', e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePreventiveAction(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Action Items
            </CardTitle>
            <Button size="sm" variant="outline" onClick={addActionItem}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar Item
            </Button>
          </div>
          <CardDescription>
            Tareas específicas para seguimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.action_items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay action items definidos</p>
              <Button size="sm" variant="link" onClick={addActionItem}>
                Agregar primer item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.action_items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
                  <input
                    type="checkbox"
                    checked={item.status === 'done'}
                    onChange={(e) => updateActionItem(index, 'status', e.target.checked ? 'done' : 'pending')}
                    className="h-5 w-5 rounded"
                  />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Tarea a realizar"
                      value={item.item}
                      onChange={(e) => updateActionItem(index, 'item', e.target.value)}
                    />
                    <Input
                      placeholder="Responsable"
                      value={item.owner}
                      onChange={(e) => updateActionItem(index, 'owner', e.target.value)}
                    />
                  </div>
                  <Badge variant={item.status === 'done' ? 'success' : 'secondary'}>
                    {item.status === 'done' ? 'Completado' : 'Pendiente'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeActionItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lessons Learned Section */}
      <Card>
        <CardHeader>
          <CardTitle>Lecciones Aprendidas</CardTitle>
          <CardDescription>
            ¿Qué aprendimos de este incidente?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.lessons_learned}
            onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
            placeholder="Describe las lecciones aprendidas, qué salió bien, qué salió mal, y qué se puede mejorar..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 pb-6">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="outline" onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Borrador
        </Button>
        <Button onClick={handleComplete} disabled={loading} className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-4 w-4 mr-2" />
          Completar Post-Mortem
        </Button>
      </div>
    </div>
  )
}
