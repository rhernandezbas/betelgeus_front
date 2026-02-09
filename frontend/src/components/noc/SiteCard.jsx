import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  MapPin,
  Phone,
  User,
  Clock,
  Wifi,
  WifiOff,
  AlertTriangle,
  Eye,
  CheckCircle,
  MessageSquare,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Helper to calculate downtime duration
const calculateDowntime = (lastChecked) => {
  if (!lastChecked) return 'Desconocido'
  const start = new Date(lastChecked)
  const now = new Date()
  const diffMs = now - start
  const diffMins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60

  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

// Helper to get severity badge
const getSeverityBadge = (outagePercentage) => {
  if (outagePercentage >= 90) {
    return { label: 'Crítico', variant: 'destructive', color: 'bg-red-500' }
  }
  if (outagePercentage >= 70) {
    return { label: 'Alto', variant: 'destructive', color: 'bg-orange-500' }
  }
  if (outagePercentage >= 50) {
    return { label: 'Medio', variant: 'warning', color: 'bg-yellow-500' }
  }
  return { label: 'Bajo', variant: 'secondary', color: 'bg-blue-500' }
}

export default function SiteCard({
  site,
  onViewDetails,
  onAcknowledge,
  onWhatsApp,
  onCreatePostMortem,
  compact = false
}) {
  const [downtime, setDowntime] = useState(calculateDowntime(site.last_checked))
  const severity = getSeverityBadge(site.outage_percentage || 0)

  // Update downtime every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setDowntime(calculateDowntime(site.last_checked))
    }, 60000)
    return () => clearInterval(interval)
  }, [site.last_checked])

  const isDown = site.is_site_down
  const StatusIcon = isDown ? WifiOff : AlertTriangle

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center justify-between p-3 rounded-lg border',
          isDown ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
        )}
      >
        <div className="flex items-center gap-3">
          <StatusIcon className={cn('h-5 w-5', isDown ? 'text-red-600' : 'text-yellow-600')} />
          <div>
            <p className="font-medium text-sm">{site.site_name}</p>
            <p className="text-xs text-muted-foreground">
              {site.device_outage_count}/{site.device_count} dispositivos caídos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={severity.variant} className="text-xs">
            {site.outage_percentage?.toFixed(0)}%
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {downtime}
          </span>
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      'transition-all hover:shadow-lg',
      isDown ? 'border-red-300 bg-red-50/30' : 'border-yellow-300 bg-yellow-50/30'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn(
              'h-5 w-5',
              isDown ? 'text-red-600' : 'text-yellow-600'
            )} />
            <div>
              <h3 className="font-semibold">{site.site_name}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {site.site_id?.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant={severity.variant}>
              {severity.label}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="font-mono font-medium">{downtime}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Dispositivos caídos</span>
            <span className="font-medium">
              {site.device_outage_count}/{site.device_count} ({site.outage_percentage?.toFixed(1)}%)
            </span>
          </div>
          <Progress
            value={site.outage_percentage || 0}
            className="h-2"
          />
        </div>

        {/* Site Info */}
        <div className="space-y-2 text-sm">
          {(site.latitude && site.longitude) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="font-mono text-xs">
                {site.latitude?.toFixed(4)}, {site.longitude?.toFixed(4)}
              </span>
            </div>
          )}

          {site.contact_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{site.contact_name}</span>
            </div>
          )}

          {site.contact_phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <a
                href={`tel:${site.contact_phone}`}
                className="text-blue-600 hover:underline"
              >
                {site.contact_phone}
              </a>
            </div>
          )}

          {site.last_checked && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Wifi className="h-4 w-4" />
              <span>
                Última verificación: {new Date(site.last_checked).toLocaleString('es-AR')}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails?.(site)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Detalles
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onAcknowledge?.(site)}
            className="flex-1"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Reconocer
          </Button>

          {site.contact_phone && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onWhatsApp?.(site)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onCreatePostMortem?.(site)}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          >
            <FileText className="h-4 w-4 mr-1" />
            Post-Mortem
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
