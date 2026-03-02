import { useState, useEffect, useCallback } from 'react'
import { whatsappApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageCircle, Check, X, RefreshCw, Send, Users, AlertTriangle, Clock } from 'lucide-react'

export default function WhatsAppAdmin() {
  const [healthStatus, setHealthStatus] = useState(null)
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)
  const [validatingId, setValidatingId] = useState(null)
  const { toast } = useToast()

  // Form states
  const [textForm, setTextForm] = useState({ phone_number: '', message: '' })
  const [overdueForm, setOverdueForm] = useState({ person_id: '' })
  const [shiftForm, setShiftForm] = useState({ person_id: '' })
  const [assignmentForm, setAssignmentForm] = useState({ person_id: '', ticket_id: '', subject: '', customer_name: '' })
  const [customForm, setCustomForm] = useState({ person_id: '', message: '' })
  const [bulkForm, setBulkForm] = useState({ person_ids: [], message: '' })

  // Sending states
  const [sendingText, setSendingText] = useState(false)
  const [sendingOverdue, setSendingOverdue] = useState(false)
  const [sendingShift, setSendingShift] = useState(false)
  const [sendingAssignment, setSendingAssignment] = useState(false)
  const [sendingCustom, setSendingCustom] = useState(false)
  const [sendingBulk, setSendingBulk] = useState(false)

  const fetchHealth = useCallback(async () => {
    try {
      const response = await whatsappApi.healthCheck()
      setHealthStatus(response.data.data || response.data)
    } catch {
      setHealthStatus(null)
    }
  }, [])

  const fetchOperators = useCallback(async () => {
    try {
      const response = await whatsappApi.getOperatorsConfig()
      setOperators(response.data.data?.operators || response.data.operators || [])
    } catch {
      toast({
        title: 'Error',
        description: 'Error al cargar configuracion de operadores',
        variant: 'destructive'
      })
    }
  }, [toast])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchHealth(), fetchOperators()])
      setLoading(false)
    }
    init()

    const healthInterval = setInterval(fetchHealth, 60000)
    return () => clearInterval(healthInterval)
  }, [fetchHealth, fetchOperators])

  const validateOperator = async (personId) => {
    setValidatingId(personId)
    try {
      const response = await whatsappApi.validateOperator(personId)
      const data = response.data.data || response.data
      toast({
        title: data.is_valid ? 'Valido' : 'Invalido',
        description: data.is_valid
          ? `Operador ${data.name} tiene configuracion valida`
          : `Operador ${data.name} tiene configuracion invalida`,
        variant: data.is_valid ? 'default' : 'destructive'
      })
      await fetchOperators()
    } catch {
      toast({
        title: 'Error',
        description: 'Error al validar operador',
        variant: 'destructive'
      })
    } finally {
      setValidatingId(null)
    }
  }

  const handleSendText = useCallback(async () => {
    if (!textForm.phone_number || !textForm.message) return
    setSendingText(true)
    try {
      await whatsappApi.sendText(textForm)
      toast({ title: 'Enviado', description: 'Mensaje de texto enviado correctamente' })
      setTextForm({ phone_number: '', message: '' })
    } catch {
      toast({ title: 'Error', description: 'Error al enviar mensaje', variant: 'destructive' })
    } finally {
      setSendingText(false)
    }
  }, [textForm, toast])

  const handleSendOverdue = useCallback(async () => {
    if (!overdueForm.person_id) return
    setSendingOverdue(true)
    try {
      await whatsappApi.sendOverdueAlert({ person_id: Number(overdueForm.person_id), tickets_list: [] })
      toast({ title: 'Enviado', description: 'Alerta de tickets vencidos enviada' })
      setOverdueForm({ person_id: '' })
    } catch {
      toast({ title: 'Error', description: 'Error al enviar alerta', variant: 'destructive' })
    } finally {
      setSendingOverdue(false)
    }
  }, [overdueForm, toast])

  const handleSendShift = useCallback(async () => {
    if (!shiftForm.person_id) return
    setSendingShift(true)
    try {
      await whatsappApi.sendShiftSummary({ person_id: Number(shiftForm.person_id), tickets_list: [] })
      toast({ title: 'Enviado', description: 'Resumen de turno enviado' })
      setShiftForm({ person_id: '' })
    } catch {
      toast({ title: 'Error', description: 'Error al enviar resumen', variant: 'destructive' })
    } finally {
      setSendingShift(false)
    }
  }, [shiftForm, toast])

  const handleSendAssignment = useCallback(async () => {
    if (!assignmentForm.person_id || !assignmentForm.ticket_id || !assignmentForm.subject || !assignmentForm.customer_name) return
    setSendingAssignment(true)
    try {
      await whatsappApi.sendAssignment({
        person_id: Number(assignmentForm.person_id),
        ticket_id: assignmentForm.ticket_id,
        subject: assignmentForm.subject,
        customer_name: assignmentForm.customer_name
      })
      toast({ title: 'Enviado', description: 'Notificacion de asignacion enviada' })
      setAssignmentForm({ person_id: '', ticket_id: '', subject: '', customer_name: '' })
    } catch {
      toast({ title: 'Error', description: 'Error al enviar notificacion', variant: 'destructive' })
    } finally {
      setSendingAssignment(false)
    }
  }, [assignmentForm, toast])

  const handleSendCustom = useCallback(async () => {
    if (!customForm.person_id || !customForm.message) return
    setSendingCustom(true)
    try {
      await whatsappApi.sendCustom({ person_id: Number(customForm.person_id), message: customForm.message })
      toast({ title: 'Enviado', description: 'Mensaje personalizado enviado' })
      setCustomForm({ person_id: '', message: '' })
    } catch {
      toast({ title: 'Error', description: 'Error al enviar mensaje', variant: 'destructive' })
    } finally {
      setSendingCustom(false)
    }
  }, [customForm, toast])

  const handleSendBulk = useCallback(async () => {
    if (bulkForm.person_ids.length === 0 || !bulkForm.message) return
    setSendingBulk(true)
    try {
      await whatsappApi.sendBulk({ person_ids: bulkForm.person_ids, message: bulkForm.message })
      toast({ title: 'Enviado', description: `Mensaje enviado a ${bulkForm.person_ids.length} operadores` })
      setBulkForm({ person_ids: [], message: '' })
    } catch {
      toast({ title: 'Error', description: 'Error al enviar mensaje masivo', variant: 'destructive' })
    } finally {
      setSendingBulk(false)
    }
  }, [bulkForm, toast])

  const toggleBulkOperator = (personId) => {
    setBulkForm(prev => ({
      ...prev,
      person_ids: prev.person_ids.includes(personId)
        ? prev.person_ids.filter(id => id !== personId)
        : prev.person_ids.length < 50
          ? [...prev.person_ids, personId]
          : prev.person_ids
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const isHealthy = healthStatus?.evolution_api === true

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administracion de WhatsApp</h1>
            <p className="text-muted-foreground">
              Gestion de mensajes y configuracion de operadores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isHealthy ? 'default' : 'destructive'} className="text-sm py-1 px-3">
            {isHealthy ? (
              <><Check className="h-3 w-3 mr-1" /> Conectado</>
            ) : (
              <><X className="h-3 w-3 mr-1" /> Desconectado</>
            )}
          </Badge>
          <Button onClick={() => { fetchHealth(); fetchOperators() }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Operator Config Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Configuracion de Operadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Operador</th>
                  <th className="text-left py-3 px-4">Person ID</th>
                  <th className="text-left py-3 px-4">Numero WhatsApp</th>
                  <th className="text-left py-3 px-4">Notificaciones</th>
                  <th className="text-left py-3 px-4">Estado</th>
                  <th className="text-right py-3 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((op) => (
                  <tr key={op.person_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{op.name}</td>
                    <td className="py-3 px-4">{op.person_id}</td>
                    <td className="py-3 px-4">{op.whatsapp_number || 'No configurado'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={op.notifications_enabled ? 'default' : 'secondary'}>
                        {op.notifications_enabled ? 'Activas' : 'Inactivas'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={op.is_valid ? 'default' : 'destructive'}>
                        {op.is_valid ? 'Valido' : 'Invalido'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        onClick={() => validateOperator(op.person_id)}
                        variant="outline"
                        size="sm"
                        disabled={validatingId === op.person_id}
                      >
                        {validatingId === op.person_id ? (
                          <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        Validar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Send Message Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Mensajes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="text">Texto Directo</TabsTrigger>
              <TabsTrigger value="overdue">Alerta Vencidos</TabsTrigger>
              <TabsTrigger value="shift">Resumen Turno</TabsTrigger>
              <TabsTrigger value="assignment">Asignacion</TabsTrigger>
              <TabsTrigger value="custom">Personalizado</TabsTrigger>
              <TabsTrigger value="bulk">Masivo</TabsTrigger>
            </TabsList>

            {/* Tab: Texto Directo */}
            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Numero de telefono</label>
                <Input
                  type="tel"
                  placeholder="5491123456789"
                  value={textForm.phone_number}
                  onChange={(e) => setTextForm(prev => ({ ...prev, phone_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  placeholder="Escribe tu mensaje..."
                  value={textForm.message}
                  onChange={(e) => setTextForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleSendText}
                disabled={sendingText || !textForm.phone_number || !textForm.message}
              >
                {sendingText ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar Mensaje
              </Button>
            </TabsContent>

            {/* Tab: Alerta Vencidos */}
            <TabsContent value="overdue" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Operador</label>
                <Select value={overdueForm.person_id} onValueChange={(val) => setOverdueForm({ person_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.person_id} value={String(op.person_id)}>
                        {op.name} (ID: {op.person_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Se enviaran los tickets vencidos del operador seleccionado
              </p>
              <Button
                onClick={handleSendOverdue}
                disabled={sendingOverdue || !overdueForm.person_id}
              >
                {sendingOverdue ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                Enviar Alerta
              </Button>
            </TabsContent>

            {/* Tab: Resumen Turno */}
            <TabsContent value="shift" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Operador</label>
                <Select value={shiftForm.person_id} onValueChange={(val) => setShiftForm({ person_id: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.person_id} value={String(op.person_id)}>
                        {op.name} (ID: {op.person_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSendShift}
                disabled={sendingShift || !shiftForm.person_id}
              >
                {sendingShift ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                Enviar Resumen
              </Button>
            </TabsContent>

            {/* Tab: Asignacion */}
            <TabsContent value="assignment" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Operador</label>
                <Select value={assignmentForm.person_id} onValueChange={(val) => setAssignmentForm(prev => ({ ...prev, person_id: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.person_id} value={String(op.person_id)}>
                        {op.name} (ID: {op.person_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ticket ID</label>
                <Input
                  placeholder="12345"
                  value={assignmentForm.ticket_id}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, ticket_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Asunto</label>
                <Input
                  placeholder="Asunto del ticket"
                  value={assignmentForm.subject}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Cliente</label>
                <Input
                  placeholder="Nombre del cliente"
                  value={assignmentForm.customer_name}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, customer_name: e.target.value }))}
                />
              </div>
              <Button
                onClick={handleSendAssignment}
                disabled={sendingAssignment || !assignmentForm.person_id || !assignmentForm.ticket_id || !assignmentForm.subject || !assignmentForm.customer_name}
              >
                {sendingAssignment ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                Enviar Notificacion
              </Button>
            </TabsContent>

            {/* Tab: Personalizado */}
            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Operador</label>
                <Select value={customForm.person_id} onValueChange={(val) => setCustomForm(prev => ({ ...prev, person_id: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar operador" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.person_id} value={String(op.person_id)}>
                        {op.name} (ID: {op.person_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje personalizado</label>
                <Textarea
                  placeholder="Escribe tu mensaje..."
                  value={customForm.message}
                  onChange={(e) => setCustomForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleSendCustom}
                disabled={sendingCustom || !customForm.person_id || !customForm.message}
              >
                {sendingCustom ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar Mensaje
              </Button>
            </TabsContent>

            {/* Tab: Masivo */}
            <TabsContent value="bulk" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Seleccionar Operadores (max 50)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border rounded-lg max-h-48 overflow-y-auto">
                  {operators.map((op) => (
                    <label
                      key={op.person_id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={bulkForm.person_ids.includes(op.person_id)}
                        onChange={() => toggleBulkOperator(op.person_id)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">{op.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {bulkForm.person_ids.length} operadores seleccionados
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensaje</label>
                <Textarea
                  placeholder="Mensaje para enviar a todos los operadores seleccionados..."
                  value={bulkForm.message}
                  onChange={(e) => setBulkForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
              </div>
              <Button
                onClick={handleSendBulk}
                disabled={sendingBulk || bulkForm.person_ids.length === 0 || !bulkForm.message}
              >
                {sendingBulk ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                Enviar a Todos
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
