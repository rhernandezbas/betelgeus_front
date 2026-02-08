import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { adminApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  RefreshCw, Clock, Bell, UserCheck, Briefcase, Plus
} from 'lucide-react'
import { OperatorCard, ConfigDialog, ScheduleForm, ScheduleList } from '@/components/operators'

export default function OperatorsManagement() {
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingOperator, setEditingOperator] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [activeScheduleTab, setActiveScheduleTab] = useState('work')
  const [newSchedule, setNewSchedule] = useState(null)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [configForm, setConfigForm] = useState({
    is_paused: false,
    assignment_paused: false,
    notifications_enabled: true,
    whatsapp_number: '',
    paused_reason: ''
  })
  const { toast } = useToast()

  const fetchOperators = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getOperators()
      setOperators(response.data.operators || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar operadores',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOperators()
  }, [])

  // Config Dialog Handlers
  const handleOpenConfig = (operator) => {
    setEditingOperator(operator)
    setConfigForm({
      is_paused: operator.is_paused || false,
      assignment_paused: operator.assignment_paused || false,
      notifications_enabled: operator.notifications_enabled !== false,
      whatsapp_number: operator.whatsapp_number || '',
      paused_reason: operator.paused_reason || ''
    })
    setConfigDialogOpen(true)
  }

  const handleSaveConfig = async () => {
    try {
      await adminApi.updateOperatorConfig(editingOperator.person_id, {
        ...configForm,
        paused_by: 'admin'
      })

      toast({
        title: 'Configuración Actualizada',
        description: `Configuración de ${editingOperator.name} actualizada exitosamente`
      })

      setConfigDialogOpen(false)
      setTimeout(() => fetchOperators(), 500)
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Error al actualizar configuración',
        variant: 'destructive'
      })
    }
  }

  // Operator Actions
  const handlePauseOperator = async (personId, name) => {
    const reason = prompt(`¿Por qué deseas pausar a ${name}?`)
    if (!reason) return

    try {
      await adminApi.pauseOperator(personId, {
        reason,
        paused_by: 'admin',
        performed_by: 'admin'
      })
      toast({
        title: 'Operador Pausado',
        description: `${name} ha sido pausado exitosamente`
      })
      fetchOperators()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al pausar operador',
        variant: 'destructive'
      })
    }
  }

  const handleResumeOperator = async (personId, name) => {
    try {
      await adminApi.resumeOperator(personId)
      toast({
        title: 'Operador Reanudado',
        description: `${name} ha sido reanudado exitosamente`
      })
      fetchOperators()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al reanudar operador',
        variant: 'destructive'
      })
    }
  }

  const handleToggleActive = async (personId, name, currentState) => {
    if (!confirm(`¿Estás seguro de ${currentState ? 'desactivar' : 'activar'} a ${name}?`)) return

    try {
      await adminApi.updateOperator(personId, {
        is_active: !currentState,
        performed_by: 'admin'
      })
      toast({
        title: 'Estado Actualizado',
        description: `${name} ha sido ${!currentState ? 'activado' : 'desactivado'}`
      })
      fetchOperators()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar estado',
        variant: 'destructive'
      })
    }
  }

  const handleSaveOperator = async () => {
    try {
      await adminApi.updateOperator(editingOperator.person_id, {
        whatsapp_number: editingOperator.whatsapp_number,
        performed_by: 'admin'
      })
      toast({
        title: 'Operador Actualizado',
        description: 'Teléfono actualizado exitosamente'
      })
      setEditDialogOpen(false)
      setEditingOperator(null)
      fetchOperators()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar operador',
        variant: 'destructive'
      })
    }
  }

  // Schedule Handlers
  const handleAddSchedule = (personId) => {
    const defaultTimes = {
      work: { start: '08:00', end: '17:00' },
      assignment: { start: '08:00', end: '16:00' },
      alert: { start: '08:00', end: '17:00' }
    }
    const times = defaultTimes[activeScheduleTab] || defaultTimes.work

    setNewSchedule({
      person_id: personId,
      day_of_week: 0,
      start_time: times.start,
      end_time: times.end,
      schedule_type: activeScheduleTab,
      is_active: true
    })
  }

  const handleSaveNewSchedule = async () => {
    try {
      await adminApi.createSchedule({
        ...newSchedule,
        schedule_type: activeScheduleTab,
        performed_by: 'admin'
      })
      const typeNames = {
        work: 'trabajo',
        assignment: 'asignación',
        alert: 'alertas'
      }
      toast({
        title: 'Horario Creado',
        description: `Horario de ${typeNames[activeScheduleTab]} creado exitosamente`
      })
      setNewSchedule(null)
      fetchOperators()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear horario',
        variant: 'destructive'
      })
    }
  }

  const handleEditSchedule = (schedule) => {
    setEditingSchedule({ ...schedule })
  }

  const handleSaveSchedule = async () => {
    try {
      await adminApi.updateSchedule(editingSchedule.id, {
        ...editingSchedule,
        performed_by: 'admin'
      })
      toast({
        title: 'Horario Actualizado',
        description: 'El horario ha sido actualizado exitosamente'
      })
      setEditingSchedule(null)
      fetchOperators()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al actualizar horario',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('¿Estás seguro de eliminar este horario?')) return

    try {
      await adminApi.deleteSchedule(scheduleId)
      toast({
        title: 'Horario Eliminado',
        description: 'El horario ha sido eliminado exitosamente'
      })
      fetchOperators()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar horario',
        variant: 'destructive'
      })
    }
  }

  // Helper Functions
  const filterSchedulesByType = (schedules) => {
    return schedules.filter(s => s.schedule_type === activeScheduleTab)
  }

  const groupSchedulesByDay = (schedules) => {
    const filtered = filterSchedulesByType(schedules)
    return filtered.reduce((acc, schedule) => {
      if (!acc[schedule.day_of_week]) {
        acc[schedule.day_of_week] = []
      }
      acc[schedule.day_of_week].push(schedule)
      return acc
    }, {})
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
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Operadores</h1>
          <p className="text-muted-foreground">
            Administra operadores, horarios de asignación y alertas
          </p>
        </div>
        <Button onClick={fetchOperators} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="operators" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operators">
            <UserCheck className="h-4 w-4 mr-2" />
            Operadores
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Clock className="h-4 w-4 mr-2" />
            Horarios
          </TabsTrigger>
        </TabsList>

        {/* Operators Tab */}
        <TabsContent value="operators" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {operators.map((operator) => (
              <OperatorCard
                key={operator.person_id}
                operator={operator}
                onConfig={handleOpenConfig}
                onPause={handlePauseOperator}
                onResume={handleResumeOperator}
                onEdit={(op) => {
                  setEditingOperator(op)
                  setEditDialogOpen(true)
                }}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>Estado general de operadores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">{operators.length}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {operators.filter(o => o.is_active && !o.is_paused).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {operators.filter(o => o.is_paused).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pausados</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600">
                    {operators.filter(o => !o.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Inactivos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          {/* Schedule Type Tabs */}
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveScheduleTab('work')}
              className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                activeScheduleTab === 'work'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock className="h-4 w-4" />
              Horarios de Trabajo
            </button>
            <button
              onClick={() => setActiveScheduleTab('assignment')}
              className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                activeScheduleTab === 'assignment'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Horarios de Asignación
            </button>
            <button
              onClick={() => setActiveScheduleTab('alert')}
              className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                activeScheduleTab === 'alert'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="h-4 w-4" />
              Horarios de Alertas
            </button>
          </div>

          {/* Info Card */}
          <Card className={
            activeScheduleTab === 'work' ? 'bg-green-50 border-green-200' :
            activeScheduleTab === 'assignment' ? 'bg-blue-50 border-blue-200' :
            'bg-orange-50 border-orange-200'
          }>
            <CardContent className="pt-6">
              <p className={`text-sm ${
                activeScheduleTab === 'work' ? 'text-green-800' :
                activeScheduleTab === 'assignment' ? 'text-blue-800' :
                'text-orange-800'
              }`}>
                {activeScheduleTab === 'work' ? (
                  <>
                    <strong>Horarios de Trabajo:</strong> Define el horario laboral general del operador.
                    Este es el horario en el que el operador está disponible para trabajar.
                  </>
                ) : activeScheduleTab === 'assignment' ? (
                  <>
                    <strong>Horarios de Asignación:</strong> Define los horarios en los que el operador puede recibir asignaciones de tickets.
                    Durante estos horarios, el sistema asignará automáticamente tickets nuevos al operador.
                  </>
                ) : (
                  <>
                    <strong>Horarios de Alertas:</strong> Define los horarios en los que el operador recibirá
                    notificaciones de WhatsApp sobre tickets vencidos o que requieren atención urgente.
                  </>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Schedules Grid */}
          <div className="grid gap-6">
            {operators.map((operator) => {
              const groupedSchedules = groupSchedulesByDay(operator.schedules || [])
              const isAddingSchedule = newSchedule?.person_id === operator.person_id
              const scheduleCount = filterSchedulesByType(operator.schedules || []).length

              return (
                <Card key={operator.person_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          {operator.name}
                        </CardTitle>
                        <CardDescription>
                          {scheduleCount} horario{scheduleCount !== 1 ? 's' : ''} de {
                            activeScheduleTab === 'work' ? 'trabajo' :
                            activeScheduleTab === 'assignment' ? 'asignación' :
                            'alertas'
                          } configurado{scheduleCount !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => handleAddSchedule(operator.person_id)}
                        size="sm"
                        disabled={isAddingSchedule}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Horario
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* New Schedule Form */}
                    {isAddingSchedule && (
                      <ScheduleForm
                        schedule={newSchedule}
                        scheduleType={activeScheduleTab}
                        onChange={setNewSchedule}
                        onSave={handleSaveNewSchedule}
                        onCancel={() => setNewSchedule(null)}
                      />
                    )}

                    {/* Schedules by Day */}
                    <ScheduleList
                      groupedSchedules={groupedSchedules}
                      editingSchedule={editingSchedule}
                      onEdit={handleEditSchedule}
                      onSave={handleSaveSchedule}
                      onCancelEdit={() => setEditingSchedule(null)}
                      onDelete={handleDeleteSchedule}
                      onEditingChange={setEditingSchedule}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Config Dialog */}
      <ConfigDialog
        operator={editingOperator}
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        configForm={configForm}
        onConfigChange={setConfigForm}
        onSave={handleSaveConfig}
      />

      {/* Edit Operator Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Operador</DialogTitle>
            <DialogDescription>
              Actualiza el número de WhatsApp del operador
            </DialogDescription>
          </DialogHeader>
          {editingOperator && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={editingOperator.name}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">Número de WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={editingOperator.whatsapp_number || ''}
                  onChange={(e) => setEditingOperator({ ...editingOperator, whatsapp_number: e.target.value })}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveOperator}>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
