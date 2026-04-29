import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select'
import { Users, Calendar, Database, TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LabelList,
} from 'recharts'
import { useDashboardData } from '@/services/dashboardHooks'
import { toast } from '@/components/ui/use-toast'

const ChildFormulirTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null
  const item = payload[0]?.payload
  if (!item) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 max-w-xs">
      <div className="text-sm font-semibold text-gray-900 wrap-break-word">{item.forumName}</div>
      <div className="text-xs text-gray-500 mt-1 wrap-break-word">Periode: {item.periodName}</div>
      <div className="text-sm text-gray-700 mt-1">
        Total Formulir: <span className="font-semibold">{item.formulirCount}</span>
      </div>
    </div>
  )
}

const ensureArray = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (data.data && Array.isArray(data.data)) return data.data
  if (data.items && Array.isArray(data.items)) return data.items
  return []
}

const CHART_COLORS = {
  'Total Pengguna': '#06b6d4',
  'Periode': '#7c3aed',
  'Data Master': '#f97316',
  ChildForum: '#7c3aed',
}

// Helper to get each day in the current month (used for 1 month / daily buckets)
const getDaysInCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days = []
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dayStart = new Date(d)
    const dayEnd = new Date(d)
    dayEnd.setHours(23, 59, 59, 999)
    const yyyy = dayStart.getFullYear()
    const mm = String(dayStart.getMonth() + 1).padStart(2, '0')
    const dd = String(dayStart.getDate()).padStart(2, '0')
    days.push({
      start: new Date(dayStart),
      end: new Date(dayEnd),
      // label as ISO date (e.g. 2026-03-01)
      label: `${yyyy}-${mm}-${dd}`,
    })
  }
  return days
}

const getMonths = (monthsCount) => {
  const now = new Date()
  const months = []
  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      start: date,
      label: date.toLocaleString('id-ID', { month: 'short', year: 'numeric' }),
    })
  }
  return months
}

const formatDateLabel = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'

  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getPeriodDisplayName = (period, index) => {
  return period?.name || period?.title || `Periode ${index + 1}`
}

const truncateLabel = (value, max = 28) => {
  if (!value) return '-'
  return value.length > max ? `${value.slice(0, max)}…` : value
}

const StatCard = ({ title, value, details, trend, loading, isAlt = false, icon: Icon }) => {
  return (
    <div className="h-full">
      <Card
        className={`border transition-all h-full ${
          isAlt
            ? 'bg-black border-gray-800 text-white hover:shadow-lg'
            : 'bg-white border-gray-200 text-gray-900 hover:shadow-md'
        }`}
      >
        <CardContent className="p-4 sm:p-5 lg:p-6 h-full flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${isAlt ? 'text-gray-300' : 'text-gray-600'}`}>
                {title}
              </p>

              {loading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className={`text-2xl sm:text-3xl font-bold leading-tight ${isAlt ? 'text-white' : 'text-gray-900'}`}>
                  {value?.toLocaleString() || 0}
                </p>
              )}

              {details && (
                <div className="mt-3 space-y-1">
                  {details.map((detail, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className={isAlt ? 'text-gray-400' : 'text-gray-500'}>
                        {detail.label}
                      </span>
                      <span className={`font-medium ${isAlt ? 'text-gray-300' : 'text-gray-700'}`}>
                        {detail.value?.toLocaleString() || 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {trend && (
                <p className={`text-xs mt-2 flex items-center gap-1 ${isAlt ? 'text-gray-400' : 'text-gray-500'}`}>
                  <TrendingUp className="w-3 h-3" />
                  {trend}
                </p>
              )}
            </div>

            <div className={`p-2 sm:p-3 rounded-full ${isAlt ? 'bg-white/10' : 'bg-gray-100'}`}>
              {Icon ? (
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isAlt ? 'text-white' : 'text-gray-700'}`} />
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const OverviewStatsChart = ({ users = [], periods = [], masters = [] }) => {
  const [selectedRange, setSelectedRange] = useState('1')

  const safeGetDate = (item) => {
    const raw = item?.created_at || item?.createdAt || null
    if (!raw) return null
    const parsed = new Date(raw)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const buckets = useMemo(() => {
    if (selectedRange === '1') return getDaysInCurrentMonth()
    return getMonths(parseInt(selectedRange, 10))
  }, [selectedRange])

  const countByBuckets = (items) => {
    const arr = ensureArray(items)
    return buckets.map((bucket) => {
      let count = 0
      for (const item of arr) {
        const d = safeGetDate(item)
        if (!d) continue
        if (selectedRange === '1') {
          if (d >= bucket.start && d <= bucket.end) count++
        } else if (
          d.getFullYear() === bucket.start.getFullYear() &&
          d.getMonth() === bucket.start.getMonth()
        ) {
          count++
        }
      }
      return count
    })
  }

  const usersCounts = countByBuckets(users)
  const periodsCounts = countByBuckets(periods)
  const mastersCounts = countByBuckets(masters)

  const chartData = buckets.map((bucket, index) => ({
    name: bucket.label,
    'Total Pengguna': usersCounts[index] || 0,
    'Periode': periodsCounts[index] || 0,
    'Data Master': mastersCounts[index] || 0,
  }))

  const isWeekly = selectedRange === '1'

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-md font-semibold">
              Ringkasan Data Master, Periode, dan Pengguna
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
             Menampilkan data per bulan, triwulan, semester dan 1 tahun.
            </p>
          </div>
          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Pilih rentang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Bulan</SelectItem>
              <SelectItem value="3">3 Bulan</SelectItem>
              <SelectItem value="6">6 Bulan</SelectItem>
              <SelectItem value="12">1 Tahun</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: isWeekly ? 30 : 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#374151', fontSize: 12 }}
                angle={isWeekly ? 0 : -45}
                textAnchor={isWeekly ? 'middle' : 'end'}
                height={isWeekly ? 40 : 70}
              />
              <YAxis tick={{ fill: '#374151', fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Data Master" fill={CHART_COLORS['Data Master']} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Periode" fill={CHART_COLORS['Periode']} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Total Pengguna" fill={CHART_COLORS['Total Pengguna']} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

const PeriodChildForumTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null

  const item = payload[0]?.payload
  if (!item) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2">
      <div className="text-sm font-semibold text-gray-900">{item.periodName}</div>
      <div className="text-xs text-gray-500 mt-1">Created: {item.createdLabel}</div>
      <div className="text-sm text-gray-700 mt-1">
        Total Forum: <span className="font-semibold">{item.totalChildForum}</span>
      </div>
    </div>
  )
}

const PeriodChildForumChart = ({ periods = [] }) => {
  const [pageSize, setPageSize] = useState('10')
  const [page, setPage] = useState(1)

  const normalizedData = useMemo(() => {
    return ensureArray(periods).map((period, index) => {
      const createdAt = period?.created_at || period?.createdAt || null
      const createdDate = createdAt ? new Date(createdAt) : null
      const createdTime =
        createdDate && !Number.isNaN(createdDate.getTime())
          ? createdDate.getTime()
          : 0

      const forums = ensureArray(period?.forums)
      const totalChildForum = Number(period?.forums_count || forums.length || 0)

      return {
        id: period?.id || index,
        periodName: getPeriodDisplayName(period, index),
        createdAt,
        createdTime,
        createdLabel: formatDateLabel(createdAt),
        totalChildForum,
      }
    })
  }, [periods])

  const sortedData = useMemo(() => {
    return [...normalizedData].sort((a, b) => b.createdTime - a.createdTime)
  }, [normalizedData])

  const pageSizeNumber = Number(pageSize)
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSizeNumber))
  const safePage = Math.min(page, totalPages)

  const pagedData = useMemo(() => {
    const start = (safePage - 1) * pageSizeNumber
    const end = start + pageSizeNumber
    return sortedData.slice(start, end)
  }, [sortedData, safePage, pageSizeNumber])

  const chartData = useMemo(() => {
    return pagedData.map((item) => ({
      ...item,
      label: `${item.periodName} • ${item.createdLabel}`,
    }))
  }, [pagedData])

  if (!normalizedData.length) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-md font-semibold">
            Total Forum Dalam 1 Periode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-sm text-gray-500">
            Data Periode belum tersedia
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-md font-semibold">
            Total Forum Dalam 1 Periode
          </CardTitle>

        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tampil</span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Jumlah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ height: Math.max(320, chartData.length * 48) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 90, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                type="number"
                tick={{ fill: '#374151', fontSize: 12 }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: '#374151', fontSize: 12 }}
                width={220}
              />
              <Tooltip content={<PeriodChildForumTooltip />} />
              <Bar
                dataKey="totalChildForum"
                fill={CHART_COLORS.ChildForum}
                radius={[0, 6, 6, 0]}
              >
                <LabelList
                  dataKey="totalChildForum"
                  position="right"
                  style={{ fill: '#374151', fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500">
            Menampilkan {(safePage - 1) * pageSizeNumber + 1} -
            {Math.min(safePage * pageSizeNumber, sortedData.length)} dari {sortedData.length} periode
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Sebelumnya
            </Button>

            <span className="text-sm text-gray-600">
              Halaman {safePage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const ChildForumFormulirChart = ({ periods = [], forums = [], findingType = '', onFindingTypeChange }) => {
  const [pageSize, setPageSize] = useState('10')
  const [page, setPage] = useState(1)

  const normalizedData = useMemo(() => {
    const directForums = ensureArray(forums).map((forum, index) => ({
      id: forum?.id || forum?.forum_id || `forum-${index}`,
      forumName: forum?.forum_name || forum?.name || `Forum ${index + 1}`,
    periodName: forum?.room_name || 'Tanpa Periode',
      formulirCount: Number(
        forum?.total_discrepancy_forms ||
        forum?.formulir_count ||
        forum?.topics_count ||
        forum?.document_count ||
        0
      ),
      createdAt: forum?.forum_created_at || forum?.created_at || forum?.createdAt || null,
    }))

    if (directForums.length > 0) {
      return directForums
    }

    const childForums = ensureArray(periods).flatMap((period) => {
  const periodName = period?.name || 'Forum Periode'
      return ensureArray(period?.forums).map((forum, index) => ({
        id: forum?.id || `${period?.id || 'period'}-${index}`,
        forumName: forum?.name || `Forum ${index + 1}`,
        periodName,
        formulirCount: Number(forum?.topics_count || forum?.formulir_count || forum?.document_count || 0),
        createdAt: forum?.created_at || forum?.createdAt || null,
      }))
    })

    return childForums
  }, [periods, forums])

  const sortedData = useMemo(() => {
    return [...normalizedData].sort((a, b) => b.formulirCount - a.formulirCount)
  }, [normalizedData])

  const pageSizeNumber = Number(pageSize)
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSizeNumber))
  const safePage = Math.min(page, totalPages)

  const chartData = useMemo(() => {
    const start = (safePage - 1) * pageSizeNumber
    const end = start + pageSizeNumber
    return sortedData.slice(start, end).map((item) => ({
      ...item,
      label: truncateLabel(`${item.forumName} • ${item.periodName}`, 30),
    }))
  }, [sortedData, safePage, pageSizeNumber])

  if (!normalizedData.length) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          {/* Title intentionally hidden per request */}
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-sm text-gray-500">
            Data Forum belum tersedia
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-md font-semibold">
              Total Formulir Ketidaksesuaian dalam 1 Forum
            </CardTitle>
          </div>

          <div className="flex flex-wrap items-center gap-3">
          <Select
            value={findingType}
            onValueChange={(value) => {
              onFindingTypeChange?.(value)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Semua kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="major">Mayor</SelectItem>
              <SelectItem value="observation">Observasi</SelectItem>
            </SelectContent>
          </Select>
          <Select value={pageSize} onValueChange={setPageSize}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Jumlah" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="w-full overflow-x-auto" style={{ height: Math.max(320, chartData.length * 48) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 90, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fill: '#374151', fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#374151', fontSize: 12 }} width={170} />
              <Tooltip content={<ChildFormulirTooltip />} />
              <Bar dataKey="formulirCount" fill="#10b981" radius={[0, 6, 6, 0]}>
                <LabelList dataKey="formulirCount" position="right" style={{ fill: '#374151', fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-gray-500">
            Menampilkan {(safePage - 1) * pageSizeNumber + 1} -
            {Math.min(safePage * pageSizeNumber, sortedData.length)} dari {sortedData.length} Forum
          </p>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
              Sebelumnya
            </Button>
            <span className="text-sm text-gray-600">Halaman {safePage} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
              Berikutnya
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const location = useLocation()
  // Radix SelectItem value can't be an empty string; use a sentinel for 'all'.
  const [discrepancyFindingType, setDiscrepancyFindingType] = useState('all')
  const {
    usersData,
    userStats,
    statsData,
    periodsArray,
    discrepancyFormsPerForumArray,
    documentMasterArray,
    isLoading,
    error,
  } = useDashboardData({ findingType: discrepancyFindingType === 'all' ? undefined : discrepancyFindingType })

  useEffect(() => {
    const welcomeMessage = sessionStorage.getItem('iso_tik_login_welcome_message')
    if (!welcomeMessage) return

    toast({
      title: welcomeMessage,
      description: 'Semoga harimu produktif 👋',
      duration: 5000,
    })
    sessionStorage.removeItem('iso_tik_login_welcome_message')
  }, [location?.key])
 
  const periodStats = useMemo(() => {
    const periods = ensureArray(periodsArray)
    const now = new Date()

    const statsRooms = statsData?.statistics?.rooms || {}
    const totalFromStats = Number(statsRooms?.total || 0)
    const activeFromStats = Number(statsRooms?.active || 0)
    const passedDeadlineFromStats = Number(statsRooms?.passed_deadline || 0)

    if (totalFromStats > 0) {
      return {
        total: totalFromStats,
        active: activeFromStats,
        inactive: passedDeadlineFromStats,
      }
    }

    const isActivePeriod = (period) => {
      const status = String(period?.status || '').toLowerCase()
      if (['active', 'open', 'ongoing', 'running'].includes(status)) return true
      if (['inactive', 'closed', 'ended', 'archived'].includes(status)) return false

      const end = period?.end_date ? new Date(period.end_date) : null
      if (end && !Number.isNaN(end.getTime())) {
        return end >= now
      }

      return true
    }

    const active = periods.filter(isActivePeriod).length
    const inactive = Math.max(0, periods.length - active)

    return {
      total: periods.length,
      active,
      inactive,
    }
  }, [periodsArray, statsData])

  const totalForums = useMemo(() => {
    const statsForums = Number(statsData?.statistics?.forums?.total || 0)
    if (statsForums > 0) return statsForums

    const periods = ensureArray(periodsArray)
    return periods.reduce((sum, period) => sum + ensureArray(period?.forums).length, 0)
  }, [statsData, periodsArray])

  const statsCards = [
    {
      title: 'Total Pengguna',
      value: userStats?.total || 0,
      icon: Users,
      details: [
        { label: 'Pengguna Aktif', value: userStats?.active || 0 },
        { label: 'Pengguna Non-aktif', value: userStats?.inactive || 0 },
      ],
      trend: statsData?.user_growth ? `+${statsData.user_growth}% growth` : null,
    },
    {
      title: 'Periode',
      value: periodStats.total,
      icon: Calendar,
      details: [
        { label: 'Lewat Deadline', value: periodStats.inactive },
        { label: 'Total Forum', value: totalForums },
      ],
    },
    {
      title: 'Data Master',
      value: ensureArray(documentMasterArray).length,
      icon: Database,
      details: [
        {
          label: 'Aktif',
          value: ensureArray(documentMasterArray).filter((d) => d?.is_active).length,
        },
        {
          label: 'Nonaktif',
          value: ensureArray(documentMasterArray).filter((d) => !d?.is_active).length,
        },
      ],
    },
  ]

  if (error) {
    return (
      <MainLayout>
        <div className="px-4 sm:px-6 py-6 bg-white min-h-screen">
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600">Terjadi kesalahan saat memuat data beranda</p>
              <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                Segarkan Halaman
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="px-4 sm:px-6 py-6 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Beranda</h1>
          <p className="text-gray-500 mt-1">Ikhtisar statistik sistem dan aktivitas forum</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-4 sm:gap-6 mb-6">
          {statsCards.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              details={stat.details}
              trend={stat.trend}
              loading={isLoading}
              isAlt={index % 2 === 0}
            />
          ))}
        </div>

        <div className="mb-6">
          <OverviewStatsChart
            users={usersData}
            periods={periodsArray}
            masters={documentMasterArray}
          />
        </div>

        <div className="mb-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PeriodChildForumChart periods={periodsArray} />
          <ChildForumFormulirChart
            periods={periodsArray}
            forums={discrepancyFormsPerForumArray}
            findingType={discrepancyFindingType}
            onFindingTypeChange={setDiscrepancyFindingType}
          />
        </div>
      </div>
    </MainLayout>
  )
}