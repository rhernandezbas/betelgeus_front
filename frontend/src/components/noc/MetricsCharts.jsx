import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity } from 'lucide-react'

// Colors for charts
const COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#2563eb',
  info: '#6b7280',
  success: '#16a34a',
  down: '#ef4444',
  degraded: '#f59e0b',
  healthy: '#10b981'
}

// Severity Distribution Pie Chart
export function SeverityPieChart({ events }) {
  const data = useMemo(() => {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    }

    events?.forEach(event => {
      if (counts[event.severity] !== undefined) {
        counts[event.severity]++
      }
    })

    return Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: COLORS[name]
      }))
  }, [events])

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="h-5 w-5" />
            Distribución por Severidad
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
          No hay eventos para mostrar
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <PieChartIcon className="h-5 w-5" />
          Distribución por Severidad
        </CardTitle>
        <CardDescription>
          Total de eventos: {events?.length || 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Sites Status Bar Chart
export function SitesStatusChart({ sites, outageSites }) {
  const data = useMemo(() => {
    const down = outageSites?.filter(s => s.is_site_down).length || 0
    const degraded = outageSites?.filter(s => !s.is_site_down).length || 0
    const total = sites?.length || 0
    const healthy = total - down - degraded

    return [
      { name: 'Saludables', value: healthy, color: COLORS.healthy },
      { name: 'Degradados', value: degraded, color: COLORS.degraded },
      { name: 'Caídos', value: down, color: COLORS.down }
    ]
  }, [sites, outageSites])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          Estado de Sites
        </CardTitle>
        <CardDescription>
          Total: {sites?.length || 0} sites
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Events by Type Chart
export function EventsByTypeChart({ events }) {
  const data = useMemo(() => {
    const counts = {}

    events?.forEach(event => {
      const type = event.event_type || 'unknown'
      counts[type] = (counts[type] || 0) + 1
    })

    const typeLabels = {
      site_outage: 'Caída de Site',
      site_degraded: 'Site Degradado',
      site_recovered: 'Recuperación',
      device_outage: 'Dispositivo',
      custom: 'Manual',
      unknown: 'Desconocido'
    }

    return Object.entries(counts).map(([type, count]) => ({
      name: typeLabels[type] || type,
      value: count
    }))
  }, [events])

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Eventos por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
          No hay eventos para mostrar
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5" />
          Eventos por Tipo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Uptime Trend Chart (Real data from stats)
export function UptimeTrendChart({ stats }) {
  const data = useMemo(() => {
    const STORAGE_KEY = 'noc_uptime_history'
    const MAX_POINTS = 24 // Keep last 24 data points (12 hours with 30s refresh)

    // Get stored history
    let history = []
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      history = stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error loading uptime history:', error)
      history = []
    }

    // Add current data point if stats available
    if (stats && stats.uptimePercent !== undefined) {
      const now = new Date()
      const newPoint = {
        timestamp: now.toISOString(),
        uptime: parseFloat(stats.uptimePercent),
        sitesDown: stats.sitesDown || 0,
        activeEvents: stats.totalActiveEvents || 0
      }

      // Check if we should add this point (avoid duplicates within 1 minute)
      const shouldAdd = history.length === 0 ||
        (now - new Date(history[history.length - 1].timestamp)) > 60000

      if (shouldAdd) {
        history.push(newPoint)

        // Keep only last MAX_POINTS
        if (history.length > MAX_POINTS) {
          history = history.slice(-MAX_POINTS)
        }

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
        } catch (error) {
          console.error('Error saving uptime history:', error)
        }
      }
    }

    // Format for chart (show last 12 points max)
    return history.slice(-12).map(point => {
      const date = new Date(point.timestamp)
      return {
        time: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        uptime: point.uptime,
        sites: point.sitesDown,
        events: point.activeEvents
      }
    })
  }, [stats])

  // Calculate min/max for Y axis domain
  const minUptime = data.length > 0 ? Math.min(...data.map(d => d.uptime)) : 90
  const yAxisMin = Math.max(0, Math.floor(minUptime / 10) * 10 - 10)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5" />
          Tendencia de Uptime
        </CardTitle>
        <CardDescription>
          {data.length > 0 ? `Últimos ${data.length} puntos de datos` : 'Recopilando datos...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Esperando datos... El gráfico se construirá con el tiempo
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis domain={[yAxisMin, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'uptime') return [`${value.toFixed(2)}%`, 'Uptime']
                  if (name === 'sites') return [value, 'Sites Caídos']
                  if (name === 'events') return [value, 'Eventos Activos']
                  return [value, name]
                }}
              />
              <Area
                type="monotone"
                dataKey="uptime"
                stroke="#10b981"
                fill="#10b98140"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

// Top Problematic Sites Table
export function TopProblematicSites({ outageSites }) {
  const sortedSites = useMemo(() => {
    return [...(outageSites || [])]
      .sort((a, b) => (b.outage_percentage || 0) - (a.outage_percentage || 0))
      .slice(0, 5)
  }, [outageSites])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Sites con Problemas</CardTitle>
        <CardDescription>
          Ordenados por porcentaje de caída
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedSites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay sites con problemas
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSites.map((site, index) => (
              <div
                key={site.site_id || index}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-muted-foreground">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{site.site_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {site.device_outage_count}/{site.device_count} dispositivos
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono font-bold ${
                    site.outage_percentage >= 90
                      ? 'text-red-600'
                      : site.outage_percentage >= 70
                      ? 'text-orange-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {site.outage_percentage?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// MTTR Stats Card
export function MTTRStats({ postMortems }) {
  const stats = useMemo(() => {
    if (!postMortems || postMortems.length === 0) {
      return { avgMTTR: 0, avgDetection: 0, avgResponse: 0, count: 0 }
    }

    // Helper to calculate time difference in minutes
    const calculateTimeDiff = (startTime, endTime) => {
      if (!startTime || !endTime) return null
      const start = new Date(startTime)
      const end = new Date(endTime)
      const diffMs = end - start
      if (diffMs < 0) return null
      return Math.floor(diffMs / 60000) // Convert to minutes
    }

    // Filter post-mortems that have the necessary timestamps
    const validPMs = postMortems.filter(pm =>
      pm.incident_start && pm.detection_time && pm.response_time
    )

    if (validPMs.length === 0) {
      return { avgMTTR: 0, avgDetection: 0, avgResponse: 0, count: 0 }
    }

    // Calculate average MTTR (downtime)
    const pmWithDowntime = validPMs.filter(pm => pm.downtime_minutes)
    const avgMTTR = pmWithDowntime.length > 0
      ? pmWithDowntime.reduce((acc, pm) => acc + pm.downtime_minutes, 0) / pmWithDowntime.length
      : 0

    // Calculate average detection time (incident_start → detection_time)
    const detectionTimes = validPMs
      .map(pm => calculateTimeDiff(pm.incident_start, pm.detection_time))
      .filter(t => t !== null)
    const avgDetection = detectionTimes.length > 0
      ? detectionTimes.reduce((acc, t) => acc + t, 0) / detectionTimes.length
      : 0

    // Calculate average response time (detection_time → response_time)
    const responseTimes = validPMs
      .map(pm => calculateTimeDiff(pm.detection_time, pm.response_time))
      .filter(t => t !== null)
    const avgResponse = responseTimes.length > 0
      ? responseTimes.reduce((acc, t) => acc + t, 0) / responseTimes.length
      : 0

    return {
      avgMTTR: Math.round(avgMTTR),
      avgDetection: Math.round(avgDetection),
      avgResponse: Math.round(avgResponse),
      count: validPMs.length
    }
  }, [postMortems])

  const formatMinutes = (mins) => {
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Métricas de Respuesta</CardTitle>
        <CardDescription>
          Basado en {stats.count} post-mortems
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {formatMinutes(stats.avgDetection)}
            </p>
            <p className="text-xs text-muted-foreground">Detección</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {formatMinutes(stats.avgResponse)}
            </p>
            <p className="text-xs text-muted-foreground">Respuesta</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {formatMinutes(stats.avgMTTR)}
            </p>
            <p className="text-xs text-muted-foreground">MTTR</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
