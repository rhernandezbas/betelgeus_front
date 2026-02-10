import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useExecutionManager } from '@/hooks/useExecutionManager'
import ExecutionsPanel from '@/components/device-analysis/ExecutionsPanel'
import {
  Search,
  Wifi,
  Clock,
  CheckCircle,
  XCircle,
  ThumbsUp,
  History,
  Loader2,
  MessageSquare,
  Server,
  Radio,
  FileText,
  Star
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Station Analyzer Class
class StationAnalyzer {
  constructor(baseUrl = 'http://190.7.234.37:7657/api/v1') {
    this.baseUrl = baseUrl
  }

  async analyzeStation(ip, mac) {
    const response = await fetch(`${this.baseUrl}/stations/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ip,
        mac,
        username: 'ubnt',
        password: 'B8d7f9ub1234!'
      })
    })

    if (!response.ok) {
      throw new Error(`Error en análisis: ${response.statusText}`)
    }

    return await response.json()
  }

  async enableFrequencies(ip, model) {
    const response = await fetch(`${this.baseUrl}/stations/enable-frequencies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, model })
    })

    if (!response.ok) {
      throw new Error(`Error habilitando frecuencias: ${response.statusText}`)
    }

    return await response.json()
  }

  async waitForConnection(ip, maxWaitTime = 360) {
    const response = await fetch(`${this.baseUrl}/stations/wait-for-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, max_wait_time: maxWaitTime })
    })

    if (!response.ok) {
      throw new Error(`Error esperando conexión: ${response.statusText}`)
    }

    return await response.json()
  }

  async getFlowStatus(ip) {
    const response = await fetch(`${this.baseUrl}/stations/flow-status/${ip}`)

    if (!response.ok) {
      throw new Error(`Error obteniendo estado: ${response.statusText}`)
    }

    return await response.json()
  }

  // Feedback Endpoints
  async submitFeedback(analysisId, feedbackData) {
    const response = await fetch(`${this.baseUrl}/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackData) // feedbackData already includes analysis_id
    })

    if (!response.ok) {
      throw new Error(`Error enviando feedback: ${response.statusText}`)
    }

    return await response.json()
  }

  async getFeedbackList() {
    const response = await fetch(`${this.baseUrl}/feedback/list`)

    if (!response.ok) {
      throw new Error(`Error obteniendo feedback: ${response.statusText}`)
    }

    return await response.json()
  }

  async getFeedbackByAnalysis(analysisId) {
    const response = await fetch(`${this.baseUrl}/feedback/analysis/${analysisId}`)

    if (!response.ok) {
      throw new Error(`Error obteniendo feedback del análisis: ${response.statusText}`)
    }

    return await response.json()
  }

  // Logs Endpoints
  async getLogs(filters = {}) {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${this.baseUrl}/logs/?${params}`)

    if (!response.ok) {
      throw new Error(`Error obteniendo logs: ${response.statusText}`)
    }

    return await response.json()
  }

  async getRecentLogs(limit = 50) {
    const response = await fetch(`${this.baseUrl}/logs/recent?limit=${limit}`)

    if (!response.ok) {
      throw new Error(`Error obteniendo logs recientes: ${response.statusText}`)
    }

    return await response.json()
  }

  async searchLogs(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters })
    const response = await fetch(`${this.baseUrl}/logs/search?${params}`)

    if (!response.ok) {
      throw new Error(`Error buscando logs: ${response.statusText}`)
    }

    return await response.json()
  }

  async clearLogs() {
    const response = await fetch(`${this.baseUrl}/logs/clear`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(`Error limpiando logs: ${response.statusText}`)
    }

    return await response.json()
  }
}

// Execution-aware wrapper for StationAnalyzer
class ExecutionAwareAnalyzer extends StationAnalyzer {
  constructor(executionId, updateCallback, baseUrl) {
    super(baseUrl)
    this.executionId = executionId
    this.updateCallback = updateCallback
  }

  async analyzeStation(ip, mac) {
    // Step 1: Ping
    this.updateCallback(this.executionId, {
      status: 'analyzing',
      progress: {
        currentStep: 'Ping Test',
        message: '🔍 Verificando conectividad con ping estructurado...'
      }
    })

    // Simulate progress for first 2 seconds (ping time)
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 2: SSH & Scans
    this.updateCallback(this.executionId, {
      status: 'analyzing',
      progress: {
        currentStep: 'Wireless Scan',
        message: '📡 Ejecutando escaneos iwlist (esto toma ~25 segundos)...'
      }
    })

    // Simulate progress for scan time
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Step 3: API Calls
    this.updateCallback(this.executionId, {
      status: 'analyzing',
      progress: {
        currentStep: 'Device Info',
        message: '🌐 Consultando información del dispositivo en UISP...'
      }
    })

    await new Promise(resolve => setTimeout(resolve, 2000))

    // Step 4: LLM Analysis
    this.updateCallback(this.executionId, {
      status: 'analyzing',
      progress: {
        currentStep: 'AI Analysis',
        message: '🤖 Generando análisis con IA (recomendaciones NOC)...'
      }
    })

    const result = await super.analyzeStation(ip, mac)

    if (result.needs_frequency_enable) {
      this.updateCallback(this.executionId, {
        status: 'frequency_prompt',
        result,
        progress: {
          currentStep: 'Frequency Prompt',
          message: `La IA recomienda habilitar frecuencias para ${result.identified_model}`
        }
      })
    }

    return result
  }

  async enableFrequencies(ip, model) {
    this.updateCallback(this.executionId, {
      status: 'enabling_frequencies',
      progress: {
        currentStep: 'Enable Frequencies',
        message: `⚙️ Habilitando frecuencias 5GHz en ${model}...`
      }
    })

    return await super.enableFrequencies(ip, model)
  }

  async waitForConnection(ip, maxWaitTime) {
    this.updateCallback(this.executionId, {
      status: 'waiting_connection',
      progress: {
        currentStep: 'Wait Connection',
        message: `⏳ Esperando reconexión del dispositivo (máx ${Math.floor(maxWaitTime / 60)}min)...`
      }
    })

    return await super.waitForConnection(ip, maxWaitTime)
  }
}

export default function DeviceAnalysis() {
  const [deviceIp, setDeviceIp] = useState('')
  const [deviceMac, setDeviceMac] = useState('')
  const [activeTab, setActiveTab] = useState('analyze')

  // Execution management
  const {
    activeExecutions,
    history,
    startExecution,
    updateExecution,
    completeExecution,
    failExecution,
    cancelExecution,
    clearHistory,
    activeCount,
    canStartNew,
    maxExecutions
  } = useExecutionManager()

  // Details dialog
  const [selectedExecution, setSelectedExecution] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  // Logs states
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsSearchQuery, setLogsSearchQuery] = useState('')
  const [logsFilters, setLogsFilters] = useState({
    level: '',
    limit: 100
  })

  // Feedback states
  const [feedbackList, setFeedbackList] = useState([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackComment, setFeedbackComment] = useState('')

  const { toast } = useToast()

  const analyzer = useMemo(() => new StationAnalyzer(), [])

  // Logs functions
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const response = await analyzer.getLogs(logsFilters)
      setLogs(response.logs || [])
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLogsLoading(false)
    }
  }, [analyzer, logsFilters, toast])

  const fetchRecentLogs = async () => {
    setLogsLoading(true)
    try {
      const response = await analyzer.getRecentLogs(50)
      setLogs(response.logs || [])
    } catch (error) {
      console.error('Error fetching recent logs:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLogsLoading(false)
    }
  }

  const searchLogs = async () => {
    if (!logsSearchQuery.trim()) {
      fetchLogs()
      return
    }
    
    setLogsLoading(true)
    try {
      const response = await analyzer.searchLogs(logsSearchQuery, logsFilters)
      setLogs(response.logs || [])
    } catch (error) {
      console.error('Error searching logs:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLogsLoading(false)
    }
  }

  const clearLogs = async () => {
    try {
      await analyzer.clearLogs()
      setLogs([])
      toast({
        title: 'Logs Limpiados',
        description: 'Todos los logs han sido eliminados'
      })
    } catch (error) {
      console.error('Error clearing logs:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // Feedback functions
  const fetchFeedbackList = useCallback(async () => {
    setFeedbackLoading(true)
    try {
      const response = await analyzer.getFeedbackList()
      setFeedbackList(response.feedback || [])
    } catch (error) {
      console.error('Error fetching feedback list:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setFeedbackLoading(false)
    }
  }, [analyzer, toast])

  // Tab change effect
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs()
    } else if (activeTab === 'feedback') {
      fetchFeedbackList()
    }
  }, [activeTab, fetchLogs, fetchFeedbackList])

  const handleFeedback = async (execution) => {
    if (!feedbackComment.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa un comentario',
        variant: 'destructive'
      })
      return
    }

    // Get analysis_id from execution result
    const analysisId = execution?.result?.analysis_id
    if (!analysisId) {
      toast({
        title: 'Error',
        description: 'No se encontró el ID del análisis',
        variant: 'destructive'
      })
      return
    }

    // Get device info from execution
    const deviceIp = execution?.result?.device_info?.ip || 'Unknown'
    const deviceMac = execution?.result?.device_info?.mac || null

    // Get current user info
    const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}')

    try {
      const feedbackData = {
        analysis_id: analysisId,
        device_ip: deviceIp,
        device_mac: deviceMac,
        feedback_type: 'positivo', // Default to positive
        rating: 5,
        comments: feedbackComment, // Changed from 'comment' to 'comments'
        user_name: currentUser?.username || currentUser?.name || 'Anónimo',
        user_email: currentUser?.email || null
      }

      await analyzer.submitFeedback(analysisId, feedbackData)

      toast({
        title: 'Gracias',
        description: 'Tu feedback ha sido enviado'
      })

      setFeedbackComment('')

      if (activeTab === 'feedback') {
        fetchFeedbackList()
      }
    } catch (error) {
      console.error('Error sending feedback:', error)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleAnalyze = async () => {
    if (!deviceIp) {
      toast({
        title: 'Error',
        description: 'La IP del dispositivo es requerida',
        variant: 'destructive'
      })
      return
    }

    if (!canStartNew) {
      toast({
        title: 'Límite Alcanzado',
        description: `Máximo ${maxExecutions} análisis simultáneos. Espera a que uno termine.`,
        variant: 'destructive'
      })
      return
    }

    const executionId = startExecution(deviceIp, deviceMac)

    if (!executionId) {
      toast({
        title: 'Error',
        description: 'No se pudo iniciar el análisis',
        variant: 'destructive'
      })
      return
    }

    // Clear form immediately
    const ip = deviceIp
    const mac = deviceMac
    setDeviceIp('')
    setDeviceMac('')

    toast({
      title: 'Análisis Iniciado',
      description: `Analizando ${ip}...`
    })

    // Run in background
    runAnalysis(executionId, ip, mac)
  }

  const runAnalysis = async (executionId, ip, mac) => {
    const execAnalyzer = new ExecutionAwareAnalyzer(executionId, updateExecution)

    try {
      // Step 1: Analyze
      const analysis = await execAnalyzer.analyzeStation(ip, mac || undefined)

      if (analysis.status !== 'success') {
        throw new Error(analysis.message || 'Error en análisis')
      }

      // Auto-enable frequencies if recommended
      if (analysis.needs_frequency_enable) {
        toast({
          title: 'Habilitando Frecuencias',
          description: `Auto-habilitando para ${analysis.identified_model}`
        })

        // Step 2: Enable frequencies
        const freqResult = await execAnalyzer.enableFrequencies(ip, analysis.identified_model)

        // Step 3: Wait for connection if needed
        if (freqResult.device_offline) {
          const connectionResult = await execAnalyzer.waitForConnection(ip, 360)

          if (!connectionResult.connection_restored) {
            throw new Error('El dispositivo no se reconectó en el tiempo esperado')
          }

          analysis.connection_restored = true
          analysis.connection_attempts = connectionResult.attempts
        }

        analysis.frequencies_enabled = true
      }

      // Complete execution
      completeExecution(executionId, analysis)

      toast({
        title: 'Análisis Completado',
        description: `${ip} - ${analysis.identified_model}`
      })
    } catch (error) {
      console.error('Error en análisis:', error)
      failExecution(executionId, error.message)

      toast({
        title: 'Error en Análisis',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const handleViewDetails = (execution) => {
    setSelectedExecution(execution)
    setDetailsDialogOpen(true)
  }

  const handleCancel = (executionId) => {
    cancelExecution(executionId)
    toast({
      title: 'Análisis Cancelado',
      description: 'El análisis ha sido cancelado'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Análisis de Estaciones</h1>
          <p className="text-gray-600">Análisis inteligente de dispositivos con IA y optimización automática</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analyze">Análisis</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Configuración de Análisis
                </CardTitle>
                <CardDescription>
                  Ingresa la IP del dispositivo para iniciar el análisis completo. Puedes ejecutar hasta {maxExecutions} análisis simultáneamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deviceIp">IP del Dispositivo *</Label>
                    <Input
                      id="deviceIp"
                      type="text"
                      placeholder="192.168.1.100"
                      value={deviceIp}
                      onChange={(e) => setDeviceIp(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deviceMac">MAC (Opcional)</Label>
                    <Input
                      id="deviceMac"
                      type="text"
                      placeholder="00:27:22:XX:XX:XX"
                      value={deviceMac}
                      onChange={(e) => setDeviceMac(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={!canStartNew || !deviceIp}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {canStartNew ? 'Iniciar Análisis' : `Límite Alcanzado (${activeCount}/${maxExecutions})`}
                </Button>
              </CardContent>
            </Card>

            {/* Active Executions Panel */}
            <ExecutionsPanel
              activeExecutions={activeExecutions}
              activeCount={activeCount}
              maxExecutions={maxExecutions}
              canStartNew={canStartNew}
              onViewDetails={handleViewDetails}
              onCancel={handleCancel}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historial de Análisis
                  </CardTitle>
                  {history.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearHistory}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Limpiar Historial
                    </Button>
                  )}
                </div>
                <CardDescription>
                  Historial completo de análisis (activos y completados)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {history.length > 0 || activeExecutions.size > 0 ? (
                  <div className="space-y-3">
                    {/* Active executions first */}
                    {Array.from(activeExecutions.values()).map((execution) => (
                      <div
                        key={execution.id}
                        className="border rounded-lg p-4 bg-blue-50 border-blue-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Wifi className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{execution.deviceIp}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              execution.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : execution.status === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {execution.status}
                            </span>
                            <span className="text-xs text-blue-600 font-medium">Activo</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(execution.startedAt).toLocaleString()}
                          </span>
                        </div>
                        {execution.progress && (
                          <p className="text-sm text-gray-600">{execution.progress.message}</p>
                        )}
                        {execution.error && (
                          <p className="text-sm text-red-600 mt-1">{execution.error}</p>
                        )}
                      </div>
                    ))}

                    {/* Completed history */}
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleViewDetails(item)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Wifi className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{item.deviceIp}</span>
                            {item.result?.identified_model && (
                              <span className="text-sm text-gray-500 uppercase">
                                {item.result.identified_model}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : item.status === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(item.startedAt).toLocaleString()}
                          </span>
                        </div>
                        {item.result?.llm_analysis && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {typeof item.result.llm_analysis === 'string'
                              ? item.result.llm_analysis.substring(0, 150) + '...'
                              : item.result.llm_analysis.summary || ''
                            }
                          </p>
                        )}
                        {item.error && (
                          <p className="text-sm text-red-600">{item.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay análisis en el historial</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Logs del Sistema
                </CardTitle>
                <CardDescription>
                  Visualiza y busca logs de las operaciones del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar en logs..."
                      value={logsSearchQuery}
                      onChange={(e) => setLogsSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchLogs()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={logsFilters.level}
                      onChange={(e) => setLogsFilters({...logsFilters, level: e.target.value})}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">Todos los niveles</option>
                      <option value="ERROR">Error</option>
                      <option value="WARNING">Warning</option>
                      <option value="INFO">Info</option>
                      <option value="DEBUG">Debug</option>
                    </select>
                    <Button onClick={searchLogs} disabled={logsLoading}>
                      {logsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                    <Button onClick={fetchRecentLogs} variant="outline" disabled={logsLoading}>
                      <Clock className="h-4 w-4 mr-2" />
                      Recientes
                    </Button>
                    <Button onClick={clearLogs} variant="destructive" disabled={logsLoading}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Limpiar
                    </Button>
                  </div>
                </div>

                {/* Logs Display */}
                <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : logs.length > 0 ? (
                    <div className="space-y-1">
                      {logs.map((log, index) => (
                        <div key={index} className="font-mono text-xs text-gray-300">
                          <span className="text-gray-500">
                            {log.timestamp || new Date().toISOString()}
                          </span>
                          <span className={`ml-2 ${
                            log.level === 'ERROR' ? 'text-red-400' :
                            log.level === 'WARNING' ? 'text-yellow-400' :
                            log.level === 'INFO' ? 'text-blue-400' :
                            'text-gray-400'
                          }`}>
                            [{log.level || 'INFO'}]
                          </span>
                          <span className="ml-2">{log.message || log}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                      <p>No hay logs para mostrar</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Feedback de Usuarios
                </CardTitle>
                <CardDescription>
                  Lista de todos los feedbacks enviados por los usuarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : feedbackList.length > 0 ? (
                  <div className="space-y-4">
                    {feedbackList.map((feedback, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">Análisis #{feedback.analysis_id}</span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < (feedback.rating || 5) 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(feedback.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{feedback.comment}</p>
                        {feedback.user_agent && (
                          <p className="text-xs text-gray-400 mt-2">
                            {feedback.user_agent}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No hay feedbacks registrados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Execution Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Detalles del Análisis
              </DialogTitle>
              <DialogDescription>
                {selectedExecution && `${selectedExecution.deviceIp} - ${new Date(selectedExecution.startedAt).toLocaleString()}`}
              </DialogDescription>
            </DialogHeader>

            {selectedExecution?.result && (
              <div className="space-y-6">
                {/* Device Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">IP</p>
                    <p className="text-lg font-semibold">{selectedExecution.result.ip}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Modelo</p>
                    <p className="text-lg font-semibold uppercase">
                      {selectedExecution.result.identified_model}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-600">Estado</p>
                    <p className="text-lg font-semibold capitalize">
                      {selectedExecution.result.status}
                    </p>
                  </div>
                </div>

                {/* LLM Analysis */}
                {selectedExecution.result.llm_analysis && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Análisis de IA
                    </h4>
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                        {typeof selectedExecution.result.llm_analysis === 'string'
                          ? selectedExecution.result.llm_analysis
                          : selectedExecution.result.llm_analysis.summary || JSON.stringify(selectedExecution.result.llm_analysis, null, 2)
                        }
                      </pre>
                    </div>
                  </div>
                )}

                {/* Device Data */}
                {selectedExecution.result.device_data && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Datos del Dispositivo
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-xs text-gray-600 overflow-x-auto">
                        {JSON.stringify(selectedExecution.result.device_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Feedback Section */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-3">Feedback del Análisis</h4>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="¿Fue útil este análisis? ¿Hay algo que podamos mejorar?"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      rows={3}
                    />
                    <Button
                      onClick={() => handleFeedback(selectedExecution)}
                      disabled={!feedbackComment.trim() || !selectedExecution.result?.analysis_id}
                      size="sm"
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Enviar Feedback
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
