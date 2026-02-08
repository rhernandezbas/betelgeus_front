import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Server,
  AlertTriangle,
  XCircle,
  Bell,
  Activity,
  TrendingUp
} from 'lucide-react'

export default function StatsCards({ stats, loading }) {
  const cards = [
    {
      title: 'Sites Monitoreados',
      value: stats?.totalSites || 0,
      icon: Server,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Sites Caídos',
      value: stats?.sitesDown || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      alert: stats?.sitesDown > 0
    },
    {
      title: 'Sites Degradados',
      value: stats?.sitesDegraded || 0,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Uptime Global',
      value: `${stats?.uptimePercent || 100}%`,
      icon: TrendingUp,
      color: stats?.uptimePercent >= 95 ? 'text-green-600' : 'text-red-600',
      bgColor: stats?.uptimePercent >= 95 ? 'bg-green-50' : 'bg-red-50'
    },
    {
      title: 'Eventos Activos',
      value: stats?.totalActiveEvents || 0,
      icon: Bell,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      alert: stats?.totalActiveEvents > 0
    },
    {
      title: 'Eventos Críticos',
      value: stats?.criticalEvents || 0,
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      alert: stats?.criticalEvents > 0
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card
            key={index}
            className={`${card.alert ? 'border-red-300 animate-pulse' : ''}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {loading ? '...' : card.value}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
