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

// Uptime Trend Chart (Real data based on events and sites)
export function UptimeTrendChart({ stats, events, sites }) {
  const data = useMemo(() => {
    // Generate last 7 days
    const days = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      days.push(date)
    }

    const totalSites = sites?.length || 1 // Avoid division by zero

    return days.map(day => {
      const dayStart = new Date(day)
      const dayEnd = new Date(day)
      dayEnd.setHours(23, 59, 59, 999)

      // Count critical outages for this day
      const criticalOutages = events?.filter(event => {
        const eventDate = new Date(event.created_at)
        const isCritical = event.severity === 'critical'
        const isOutage = event.event_type === 'site_outage' || event.event_type === 'site_degraded'
        const isInDay = eventDate >= dayStart && eventDate <= dayEnd
        return isCritical && isOutage && isInDay
      }).length || 0

      // Calculate uptime percentage for the day
      // If it's today, use current stats, otherwise calculate from events
      const isToday = day.toDateString() === now.toDateString()
      let uptime

      if (isToday && stats?.uptimePercent !== undefined) {
        // Use current real-time uptime for today
        uptime = parseFloat(stats.uptimePercent)
      } else {
        // Calculate uptime based on critical outages
        // Assume each critical outage affects 1 site
        const affectedSites = Math.min(criticalOutages, totalSites)
        const healthySites = totalSites - affectedSites
        uptime = (healthySites / totalSites) * 100
      }

      return {
        date: day.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
        uptime: Math.max(0, Math.min(100, uptime)), // Clamp between 0-100
        incidents: criticalOutages,
        fullDate: day.toLocaleDateString('es-AR')
      }
    })
  }, [stats, events, sites])

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
          Últimos 7 días (basado en incidentes críticos)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis domain={[yAxisMin, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'uptime') return [`${value.toFixed(2)}%`, 'Uptime']
                if (name === 'incidents') return [value, 'Incidentes Críticos']
                return [value, name]
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullDate
                }
                return label
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
