import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Clock,
  User,
  CheckCircle,
  Eye,
  Edit,
  Download,
  Trash2,
  AlertTriangle,
  GitBranch,
  Link2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Status config
const statusConfig = {
  draft: { label: 'Borrador', color: 'secondary', icon: Edit },
  in_progress: { label: 'En Progreso', color: 'warning', icon: Clock },
  completed: { label: 'Completado', color: 'default', icon: CheckCircle },
  reviewed: { label: 'Revisado', color: 'success', icon: Eye }
}

// Format duration helper
const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '-'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// Calculate time difference in minutes between two timestamps
const calculateTimeDiff = (startTime, endTime) => {
  if (!startTime || !endTime) return null
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end - start
  if (diffMs < 0) return null
  return Math.floor(diffMs / 60000) // Convert to minutes
}

export default function PostMortemCard({
  postMortem,
  onView,
  onEdit,
  onComplete,
  onReview,
  onReport,
  onDelete,
  onRelate,
  currentUser,
  compact = false
}) {
  const status = statusConfig[postMortem.status] || statusConfig.draft
  const StatusIcon = status.icon
  const isAdmin = currentUser?.role === 'admin'

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">{postMortem.title}</p>
            <p className="text-xs text-muted-foreground">
              Evento #{postMortem.alert_event_id} • Downtime: {formatDuration(postMortem.downtime_minutes)}
            </p>
          </div>
        </div>
        <Badge variant={status.color}>{status.label}</Badge>
      </div>
    )
  }

  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-full',
              postMortem.status === 'completed' || postMortem.status === 'reviewed'
                ? 'bg-green-100'
                : 'bg-gray-100'
            )}>
              <StatusIcon className={cn(
                'h-5 w-5',
                postMortem.status === 'completed' || postMortem.status === 'reviewed'
                  ? 'text-green-600'
                  : 'text-gray-600'
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={status.color}>{status.label}</Badge>
                <span className="text-xs text-muted-foreground">
                  #{postMortem.id}
                </span>
              </div>
              <h3 className="font-semibold">{postMortem.title}</h3>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Info */}
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Estado: {status.label}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {postMortem.author && `Autor: ${postMortem.author}`}
          </div>
        </div>

        {/* Summary */}
        {postMortem.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {postMortem.summary}
          </p>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="text-center p-2 rounded bg-red-50">
            <p className="text-lg font-bold text-red-600">
              {formatDuration(postMortem.downtime_minutes)}
            </p>
            <p className="text-xs text-muted-foreground">Downtime</p>
          </div>
          <div className="text-center p-2 rounded bg-blue-50">
            <p className="text-lg font-bold text-blue-600">
              {formatDuration(calculateTimeDiff(postMortem.incident_start, postMortem.detection_time))}
            </p>
            <p className="text-xs text-muted-foreground">Detección</p>
          </div>
          <div className="text-center p-2 rounded bg-yellow-50">
            <p className="text-lg font-bold text-yellow-600">
              {formatDuration(calculateTimeDiff(postMortem.detection_time, postMortem.response_time))}
            </p>
            <p className="text-xs text-muted-foreground">Respuesta</p>
          </div>
          <div className="text-center p-2 rounded bg-green-50">
            <p className="text-lg font-bold text-green-600">
              {formatDuration(calculateTimeDiff(postMortem.response_time, postMortem.resolution_time))}
            </p>
            <p className="text-xs text-muted-foreground">Resolución</p>
          </div>
        </div>

        {/* Root Cause */}
        {postMortem.root_cause && (
          <div className="p-2 rounded bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-2 text-orange-800 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium">Causa Raíz</span>
            </div>
            <p className="text-sm text-orange-900 line-clamp-2">
              {postMortem.root_cause}
            </p>
          </div>
        )}

        {/* Primary Incident Badge */}
        {postMortem.child_count > 0 && (
          <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-800">
                <GitBranch className="h-4 w-4" />
                <span className="text-sm font-medium">Incidente Principal</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100">
                {postMortem.child_count} secundario{postMortem.child_count !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{postMortem.author || 'Sin autor'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {postMortem.incident_start
                ? new Date(postMortem.incident_start).toLocaleDateString('es-AR')
                : 'Sin fecha'}
            </span>
          </div>
          {postMortem.alert_event_id && (
            <span>Evento #{postMortem.alert_event_id}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => onView?.(postMortem)}>
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>

          {/* Editar disponible para todos (excepto reviewed) */}
          {postMortem.status !== 'reviewed' && (
            <Button size="sm" variant="outline" onClick={() => onEdit?.(postMortem)}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          )}

          {/* Completar solo para admin y cuando no está completed/reviewed */}
          {isAdmin && (postMortem.status === 'draft' || postMortem.status === 'in_progress') && (
            <Button
              size="sm"
              onClick={() => onComplete?.(postMortem.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Completar
            </Button>
          )}

          {/* Marcar Revisado solo para admin */}
          {isAdmin && postMortem.status === 'completed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReview?.(postMortem.id)}
              className="text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Eye className="h-4 w-4 mr-1" />
              Marcar Revisado
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onReport?.(postMortem.id)}
          >
            <Download className="h-4 w-4 mr-1" />
            Reporte
          </Button>

          {onRelate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRelate(postMortem)}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Link2 className="h-4 w-4 mr-1" />
              Relacionar
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete?.(postMortem.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
