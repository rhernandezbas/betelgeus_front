import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Play,
  Pause,
  RefreshCw,
  MessageSquare,
  Heart,
  CheckCircle,
  XCircle,
  Send,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Polling Control Component
export function PollingControl({
  pollingStatus,
  loading,
  onStart,
  onStop,
  onScan
}) {
  const [scanLoading, setScanLoading] = useState(false)

  const handleScan = async () => {
    setScanLoading(true)
    try {
      await onScan?.()
    } finally {
      setScanLoading(false)
    }
  }

  const isRunning = pollingStatus?.is_running

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className={cn('h-5 w-5', isRunning && 'animate-spin')} />
            Control de Polling
          </CardTitle>
          <Badge variant={isRunning ? 'default' : 'secondary'} className="text-sm">
            {isRunning ? 'Ejecutando' : 'Detenido'}
          </Badge>
        </div>
        <CardDescription>
          Escaneo automático de sites cada {pollingStatus?.interval_seconds || 300} segundos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gray-50">
            <p className="text-sm text-muted-foreground mb-1">Intervalo</p>
            <p className="text-lg font-semibold">
              {pollingStatus?.interval_seconds || 300} segundos
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50">
            <p className="text-sm text-muted-foreground mb-1">Último Escaneo</p>
            <p className="text-lg font-semibold">
              {pollingStatus?.last_scan_time
                ? new Date(pollingStatus.last_scan_time).toLocaleTimeString('es-AR')
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Last Scan Result */}
        {pollingStatus?.last_scan_result && (
          <div className="p-4 rounded-lg border">
            <p className="text-sm font-medium mb-2">Resultado del Último Escaneo</p>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <p className="text-lg font-bold text-blue-600">
                  {pollingStatus.last_scan_result.summary?.total_sites || 0}
                </p>
                <p className="text-xs text-muted-foreground">Sites</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-600">
                  {pollingStatus.last_scan_result.summary?.sites_down || 0}
                </p>
                <p className="text-xs text-muted-foreground">Caídos</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">
                  {pollingStatus.last_scan_result.summary?.sites_recovered || 0}
                </p>
                <p className="text-xs text-muted-foreground">Recuperados</p>
              </div>
              <div>
                <p className="text-lg font-bold text-purple-600">
                  {pollingStatus.last_scan_result.summary?.events_created || 0}
                </p>
                <p className="text-xs text-muted-foreground">Eventos</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {isRunning ? (
            <Button
              onClick={onStop}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              <Pause className="h-4 w-4 mr-2" />
              Detener Polling
            </Button>
          ) : (
            <Button
              onClick={onStart}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Polling
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleScan}
            disabled={scanLoading}
            className="flex-1"
          >
            {scanLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Escanear Ahora
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// WhatsApp Test Component
export function WhatsAppTest({ onTest }) {
  const [testType, setTestType] = useState('complete')
  const [siteId, setSiteId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleTest = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await onTest?.(testType, siteId || null)
      setResult(res)
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Test de WhatsApp
        </CardTitle>
        <CardDescription>
          Envía una notificación de prueba para verificar la configuración
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Selection */}
        <div className="space-y-2">
          <Label>Tipo de Mensaje</Label>
          <div className="flex gap-2">
            {['complete', 'summary', 'recovery'].map((type) => (
              <Button
                key={type}
                variant={testType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTestType(type)}
                className="flex-1 capitalize"
              >
                {type === 'complete' && 'Completo'}
                {type === 'summary' && 'Resumen'}
                {type === 'recovery' && 'Recuperación'}
              </Button>
            ))}
          </div>
        </div>

        {/* Site ID (optional) */}
        <div className="space-y-2">
          <Label htmlFor="site-id">Site ID (opcional)</Label>
          <Input
            id="site-id"
            placeholder="Ej: nodo-central"
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
          />
        </div>

        {/* Send Button */}
        <Button
          onClick={handleTest}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Enviar Test
        </Button>

        {/* Result */}
        {result && (
          <div className={cn(
            'p-4 rounded-lg',
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          )}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className={cn(
                'font-medium',
                result.success ? 'text-green-800' : 'text-red-800'
              )}>
                {result.success ? 'Enviado Exitosamente' : 'Error al Enviar'}
              </span>
            </div>
            {result.message && (
              <p className="text-sm text-muted-foreground">{result.message}</p>
            )}
            {result.error && (
              <p className="text-sm text-red-600">{result.error}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Health Check Component
export function HealthCheck({ health, onRefresh }) {
  const [loading, setLoading] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      await onRefresh?.()
    } finally {
      setLoading(false)
    }
  }

  const isHealthy = health?.status === 'healthy'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className={cn('h-5 w-5', isHealthy ? 'text-green-600' : 'text-red-600')} />
            Estado del Sistema
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Status */}
        <div className={cn(
          'p-4 rounded-lg text-center',
          isHealthy ? 'bg-green-50' : 'bg-red-50'
        )}>
          <div className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full',
            isHealthy ? 'bg-green-100' : 'bg-red-100'
          )}>
            {isHealthy ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <span className={cn(
              'text-lg font-semibold',
              isHealthy ? 'text-green-800' : 'text-red-800'
            )}>
              {isHealthy ? 'Sistema Saludable' : 'Problemas Detectados'}
            </span>
          </div>
        </div>

        {/* Status Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <span className="text-sm text-muted-foreground">Servicio</span>
            <Badge variant="outline">{health?.service || 'alerting'}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <span className="text-sm text-muted-foreground">UNMS</span>
            <Badge variant={health?.unms_configured ? 'default' : 'destructive'}>
              {health?.unms_configured ? 'Configurado' : 'No Configurado'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <span className="text-sm text-muted-foreground">WhatsApp</span>
            <Badge variant={health?.whatsapp_enabled ? 'default' : 'secondary'}>
              {health?.whatsapp_enabled ? 'Habilitado' : 'Deshabilitado'}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <span className="text-sm text-muted-foreground">Polling</span>
            <Badge variant={health?.polling_running ? 'default' : 'secondary'}>
              {health?.polling_running ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Site Details Modal Content (for the map/list)
export function SiteDetailsContent({ site }) {
  if (!site) return null

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Site ID</p>
          <p className="font-mono text-sm">{site.site_id}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Estado</p>
          <Badge variant={site.is_site_down ? 'destructive' : 'warning'}>
            {site.is_site_down ? 'Caído' : 'Degradado'}
          </Badge>
        </div>
      </div>

      {/* Device Stats */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">Dispositivos</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div
              className="bg-red-500 h-4 rounded-full"
              style={{ width: `${site.outage_percentage || 0}%` }}
            />
          </div>
          <span className="text-sm font-medium">
            {site.device_outage_count}/{site.device_count}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {site.outage_percentage?.toFixed(1)}% de dispositivos caídos
        </p>
      </div>

      {/* Contact */}
      {(site.contact_name || site.contact_phone) && (
        <div className="p-3 rounded-lg bg-blue-50">
          <p className="text-sm font-medium text-blue-800 mb-1">Contacto</p>
          {site.contact_name && (
            <p className="text-sm">👤 {site.contact_name}</p>
          )}
          {site.contact_phone && (
            <p className="text-sm">
              📞 <a href={`tel:${site.contact_phone}`} className="text-blue-600 hover:underline">
                {site.contact_phone}
              </a>
            </p>
          )}
        </div>
      )}

      {/* Location */}
      {(site.latitude && site.longitude) && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Ubicación</p>
          <p className="font-mono text-sm">
            {site.latitude?.toFixed(6)}, {site.longitude?.toFixed(6)}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${site.latitude},${site.longitude}`,
                '_blank'
              )
            }}
          >
            Ver en Google Maps
          </Button>
        </div>
      )}

      {/* Last Checked */}
      {site.last_checked && (
        <div>
          <p className="text-sm text-muted-foreground">Última Verificación</p>
          <p className="text-sm">
            {new Date(site.last_checked).toLocaleString('es-AR')}
          </p>
        </div>
      )}
    </div>
  )
}
