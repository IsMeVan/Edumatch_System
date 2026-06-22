import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Function to load all dashboard data
    const loadDashboard = (showLoading = false) => {
      if (showLoading) setLoading(true)

      Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/chart-data')
      ])
        .then(([statsRes, chartsRes]) => {
          setData(statsRes.data)
          setChartData(chartsRes.data)
        })
        .catch(err => setError(err.response?.data?.detail || 'Failed to load'))
        .finally(() => {
          if (showLoading) setLoading(false)
        })
    }

    // Initial load (with spinner)
    loadDashboard(true)

    // Auto-refresh every 15 seconds (silent, no spinner)
    const interval = setInterval(() => {
      loadDashboard(false)
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-700 dark:text-red-400">
        {error}
      </div>
    )
  }

  const s = data.stats

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            Platform overview and statistics
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={s.total_users} sub={`${s.total_admins} admins`} />
        <StatCard label="Schools" value={s.total_schools} sub="institutions" />
        <StatCard label="Majors" value={s.total_majors} sub={`${s.unique_majors} unique`} />
        <StatCard label="Favorites" value={s.total_favorites} sub="user saved" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Scholarships" value={s.total_scholarships} />
        <StatCard label="Conversations" value={s.total_chats} />
        <StatCard label="Messages" value={s.total_messages} />
      </div>

      {/* Chart Carousel */}
      <ChartCarousel data={chartData} />

      {/* Recent Reports */}
      <RecentReports />

      <div className="bg-gradient-to-br from-brand-500 to-purple-500 rounded-2xl p-6 text-white">
        <h3 className="font-bold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/users" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition">Manage Users</Link>
          <Link to="/admin/schools" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition">Manage Schools</Link>
          <Link to="/admin/majors" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition">Manage Majors</Link>
        </div>
      </div>
    </div>
  )
}


function StatCard({ label, value, sub }) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : (value ?? '0')

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{label}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">
        {displayValue}
      </div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}


/* ─── CHART CAROUSEL ─── */

function ChartCarousel({ data }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!data) return null

  const charts = [
    {
      id: 'signups',
      title: 'New User Registrations',
      subtitle: 'Daily signups in the last 30 days',
      component: <LineChart data={data.signups} />,
    },
    {
      id: 'regions',
      title: 'Schools by Region',
      subtitle: 'Distribution of schools across Cambodia',
      component: <DonutChart data={data.schools_by_region} colors={['#6366f1', '#ec4899']} />,
    },
    {
      id: 'types',
      title: 'Schools by Type',
      subtitle: 'Public vs Private institutions',
      component: <DonutChart data={data.schools_by_type} colors={['#10b981', '#3b82f6', '#f59e0b']} />,
    },
    {
      id: 'favorited',
      title: 'Most Favorited Schools',
      subtitle: 'Top 10 schools users like the most',
      component: <BarChart data={data.top_favorited} color="#ec4899" />,
    },
    {
      id: 'majors',
      title: 'Schools with Most Majors',
      subtitle: 'Top 10 schools by number of programs offered',
      component: <BarChart data={data.top_by_majors} color="#6366f1" />,
    },
    {
      id: 'chat',
      title: 'Chatbot Activity',
      subtitle: 'User questions to AI in the last 30 days',
      component: <LineChart data={data.chat_activity} color="#a855f7" />,
    },
  ]

  const goPrev = () => setCurrentIndex(i => Math.max(0, i - 1))
  const goNext = () => setCurrentIndex(i => Math.min(charts.length - 1, i + 1))

  const current = charts[currentIndex]

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 dark:text-white truncate">{current.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{current.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs text-gray-500 px-2 font-medium">
            {currentIndex + 1} / {charts.length}
          </span>
          <button
            onClick={goNext}
            disabled={currentIndex === charts.length - 1}
            className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chart content */}
      <div className="min-h-[320px]">
        {current.component}
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {charts.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all ${i === currentIndex
              ? 'w-8 bg-brand-500'
              : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
              }`}
            aria-label={`Go to chart ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}


/* ─── LINE CHART ─── */

function LineChart({ data: rawData, color = '#6366f1' }) {
  const days = 30
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const lookup = {}
  if (rawData) {
    for (const d of rawData) {
      lookup[d.date] = d.count
    }
  }

  const data = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    data.push({ date: dateStr, count: lookup[dateStr] || 0, label: date })
  }

  const width = 800, height = 260
  const padding = { top: 60, right: 20, bottom: 40, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxCount = Math.max(...data.map(d => d.count), 1)
  const total = data.reduce((sum, d) => sum + d.count, 0)

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartWidth,
    y: padding.top + chartHeight - (d.count / maxCount) * chartHeight,
    ...d,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

  const yLabels = []
  const step = Math.max(1, Math.ceil(maxCount / 4))
  for (let val = 0; val <= maxCount; val += step) yLabels.push(val)
  if (yLabels[yLabels.length - 1] !== maxCount) yLabels.push(maxCount)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4 text-sm text-gray-500 dark:text-gray-400">
        <div>Total: <span className="font-bold text-gray-900 dark:text-white">{total}</span></div>
        <div>Peak: <span className="font-bold text-brand-600">{maxCount}</span></div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id={`area-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {yLabels.map((val, i) => {
          const y = padding.top + chartHeight - (val / maxCount) * chartHeight
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-gray-300 dark:text-gray-700" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" className="fill-gray-500 dark:fill-gray-400">{val}</text>
            </g>
          )
        })}

        <path d={areaPath} fill={`url(#area-${color})`} />
        <path d={linePath} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => {
          if (p.count === 0) return null
          const tooltipY = Math.max(p.y - 50, 10)
          return (
            <g key={i} className="group">
              <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
              <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2.5" />
              <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <rect x={p.x - 50} y={tooltipY} width="100" height="40" rx="6" fill="#1f2937" />
                <text x={p.x} y={tooltipY + 17} textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">{p.count}</text>
                <text x={p.x} y={tooltipY + 32} textAnchor="middle" fontSize="10" fill="#9ca3af">
                  {p.label.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </text>
              </g>
            </g>
          )
        })}

        {points.map((p, i) => {
          if (i !== 0 && i !== points.length - 1 && i % 5 !== 0) return null
          return (
            <text key={i} x={p.x} y={height - padding.bottom + 20} textAnchor="middle" fontSize="10" className="fill-gray-500 dark:fill-gray-400">
              {`${p.label.getDate()}/${p.label.getMonth() + 1}`}
            </text>
          )
        })}
      </svg>
    </div>
  )
}


/* ─── DONUT CHART ─── */

function DonutChart({ data, colors }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-12">No data</p>
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const r = 90
  const innerR = 55

  let cumAngle = -Math.PI / 2  // Start from top

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI
    const startAngle = cumAngle
    const endAngle = cumAngle + angle

    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)

    const x3 = cx + innerR * Math.cos(endAngle)
    const y3 = cy + innerR * Math.sin(endAngle)
    const x4 = cx + innerR * Math.cos(startAngle)
    const y4 = cy + innerR * Math.sin(startAngle)

    const largeArc = angle > Math.PI ? 1 : 0

    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ')

    // Label position (middle of slice)
    const midAngle = (startAngle + endAngle) / 2
    const labelR = (r + innerR) / 2
    const labelX = cx + labelR * Math.cos(midAngle)
    const labelY = cy + labelR * Math.sin(midAngle)

    cumAngle = endAngle

    return {
      ...d,
      path,
      color: colors[i % colors.length],
      percent: ((d.value / total) * 100).toFixed(1),
      labelX,
      labelY,
    }
  })

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-64 h-64">
        {slices.map((s, i) => (
          <g key={i} className="group">
            <path
              d={s.path}
              fill={s.color}
              className="hover:opacity-80 transition cursor-pointer"
            />
            {s.value / total > 0.1 && (
              <text
                x={s.labelX}
                y={s.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="bold"
                fill="white"
              >
                {s.percent}%
              </text>
            )}
          </g>
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="14" className="fill-gray-500 dark:fill-gray-400">
          Total
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="24" fontWeight="bold" className="fill-gray-900 dark:fill-white">
          {total}
        </text>
      </svg>

      <div className="space-y-2">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: s.color }} />
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">{s.label}</div>
              <div className="text-xs text-gray-500">{s.value} ({s.percent}%)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


/* ─── HORIZONTAL BAR CHART ─── */

function BarChart({ data, color = '#6366f1' }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500 py-12">No data</p>
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="space-y-3 py-4">
      {data.map((item, i) => {
        const percent = (item.value / maxValue) * 100
        return (
          <div key={i} className="group">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-bold flex items-center justify-center flex-shrink-0 text-gray-600 dark:text-gray-400">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">
                    {item.label}
                  </span>
                  <span className="text-sm font-bold flex-shrink-0" style={{ color }}>
                    {item.value}
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all group-hover:opacity-80"
                    style={{
                      width: `${percent}%`,
                      background: `linear-gradient(to right, ${color}, ${color}cc)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
function RecentReports() {
  const [data, setData] = useState({ reports: [], counts: { new: 0, total: 0 } })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/admin/all?status=new')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Recent Reports</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Latest user feedback and bug reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.counts.new > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
              {data.counts.new} NEW
            </span>
          )}
          <Link
            to="/admin/reports"
            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            View all
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : data.reports.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          <p className="text-sm text-gray-500">No new reports - all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.reports.slice(0, 5).map(report => (
            <div
              key={report.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${report.type === 'bug' ? 'bg-red-500' :
                  report.type === 'feedback' ? 'bg-blue-500' :
                    report.type === 'missing_data' ? 'bg-amber-500' : 'bg-gray-500'
                }`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase text-gray-500">
                    {report.type.replace('_', ' ')}
                  </span>
                  {report.user && (
                    <span className="text-xs text-gray-400">
                      by {report.user.name}
                    </span>
                  )}
                </div>
                {report.subject && (
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {report.subject}
                  </div>
                )}
                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {report.message}
                </div>
              </div>

              <Link
                to="/admin/reports"
                className="text-xs text-brand-600 hover:underline flex-shrink-0"
              >
                View →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}