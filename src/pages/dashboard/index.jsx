import React, { useEffect, useMemo, useState } from 'react'
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
  ComposedChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LabelList,
} from 'recharts'
import { motion } from 'framer-motion'
import { useDashboardData } from '@/services/dashboardHooks'

const ensureArray = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (data.data && Array.isArray(data.data)) return data.data
  if (data.items && Array.isArray(data.items)) return data.items
  return []
}

const CHART_COLORS = {
  Users: '#06b6d4',
  Periods: '#7c3aed',
  'Data Master': '#f97316',
  ChildForum: '#7c3aed',
}

const METRIC_LABELS = {
  users: 'Total users per periode (aktif + non-aktif)',
  periods: 'Total periode & total child forum per periode waktu',
  masters: 'Total data master per periode (aktif + non-aktif)',
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

const StatCard = ({ title, value, icon: Icon, details, trend, loading, isAlt = false }) => {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card
        className={`border transition-all h-full ${
          isAlt
            ? 'bg-black border-gray-800 text-white hover:shadow-lg'
            : 'bg-white border-gray-200 text-gray-900 hover:shadow-md'
        }`}
      >
        <CardContent className="p-6 h-full flex flex-col">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${isAlt ? 'text-gray-300' : 'text-gray-600'}`}>
                {title}
              </p>

              {loading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className={`text-3xl font-bold ${isAlt ? 'text-white' : 'text-gray-900'}`}>
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

            <div className={`p-3 rounded-full ${isAlt ? 'bg-white/10' : 'bg-gray-100'}`}>
              <Icon className={`w-6 h-6 ${isAlt ? 'text-white' : 'text-gray-700'}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

const safeGetDate = (item) => {
  const d =
    item?.created_at ||
    item?.createdAt ||
    item?.createdAtDate ||
    item?.created ||
    null

  if (!d) return null

  const parsed = new Date(d)
  return !Number.isNaN(parsed.getTime()) ? parsed : null
}

const getWeeksInCurrentMonth = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const weeks = []
  const firstDayOfWeek = firstDay.getDay()
  const daysToFirstMonday = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  let currentWeekStart = new Date(firstDay)
  currentWeekStart.setDate(currentWeekStart.getDate() - daysToFirstMonday)

  let weekNumber = 1
  while (currentWeekStart <= lastDay && weeks.length < 4) {
    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const weekStartInMonth = new Date(Math.max(currentWeekStart, firstDay))
    const weekEndInMonth = new Date(Math.min(weekEnd, lastDay))
    const daysInMonth = Math.max(
      0,
      Math.ceil((weekEndInMonth - weekStartInMonth) / (1000 * 60 * 60 * 24)) + 1
    )

    if (daysInMonth >= 3) {
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(weekEnd),
        label: `Minggu ${weekNumber}`,
      })
      weekNumber++
    }

    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
  }

  return weeks
}

const getMonths = (monthsCount) => {
  const now = new Date()
  const months = []

  for (let i = monthsCount - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = date.toLocaleString('id-ID', { month: 'short', year: 'numeric' })
    months.push({ start: date, label })
  }

  return months
}

const OverviewStatsChart = ({ users = [], periods = [], masters = [] }) => {
  const [selectedRange, setSelectedRange] = useState('3')
  const [selectedMetric, setSelectedMetric] = useState('users')

  const buckets = useMemo(() => {
    if (selectedRange === '1') return getWeeksInCurrentMonth()
    return getMonths(parseInt(selectedRange, 10))
  }, [selectedRange])

  const chartData = useMemo(() => {
    const usersList = ensureArray(users)
    const periodsList = ensureArray(periods)
    const mastersList = ensureArray(masters)

    const isInBucket = (date, bucket) => {
      if (!date) return false
      if (selectedRange === '1') {
        return date >= bucket.start && date <= bucket.end
      }
      return (
        date.getFullYear() === bucket.start.getFullYear() &&
        date.getMonth() === bucket.start.getMonth()
      )
    }

    return buckets.map((bucket) => {
      const bucketUsers = usersList.filter((user) => isInBucket(safeGetDate(user), bucket))
      const usersActive = bucketUsers.filter(
        (user) => user?.status === 'active' || user?.status === 'activated'
      ).length
      const usersInactive = bucketUsers.length - usersActive

      const bucketPeriods = periodsList.filter((period) => isInBucket(safeGetDate(period), bucket))
      const childForumTotal = bucketPeriods.reduce(
        (sum, period) => sum + Number(period?.forums_count || 0),
        0
      )

      const bucketMasters = mastersList.filter((master) => isInBucket(safeGetDate(master), bucket))
      const mastersActive = bucketMasters.filter((master) => Boolean(master?.is_active)).length
      const mastersInactive = bucketMasters.length - mastersActive

      return {
        name: bucket.label,
        usersTotal: bucketUsers.length,
        usersActive,
        usersInactive,
        periodsTotal: bucketPeriods.length,
        childForumTotal,
        mastersTotal: bucketMasters.length,
        mastersActive,
        mastersInactive,
      }
    })
  }, [users, periods, masters, buckets, selectedRange])

  const renderMetricSeries = () => {
    if (selectedMetric === 'users') {
      return (
        <>
          <Bar dataKey="usersActive" stackId="users" fill="#06b6d4" name="Users Aktif" />
          <Bar dataKey="usersInactive" stackId="users" fill="#9ca3af" name="Users Non-aktif" />
          <Line
            type="monotone"
            dataKey="usersTotal"
            name="Total Users"
            stroke="#0e7490"
            strokeWidth={2.5}
            dot={{ r: 4 }}
          />
        </>
      )
    }

    if (selectedMetric === 'periods') {
      return (
        <>
          <Bar dataKey="periodsTotal" fill="#7c3aed" name="Total Periode" />
          <Bar dataKey="childForumTotal" fill="#c084fc" name="Total Child Forum" />
        </>
      )
    }

    return (
      <>
        <Bar dataKey="mastersActive" stackId="masters" fill="#f97316" name="Master Aktif" />
        <Bar dataKey="mastersInactive" stackId="masters" fill="#9a3412" name="Master Non-aktif" />
        <Line
          type="monotone"
          dataKey="mastersTotal"
          name="Total Data Master"
          stroke="#ea580c"
          strokeWidth={2.5}
          dot={{ r: 4 }}
        />
      </>
    )
  }

  return (
    <Card className="border border-gray-200">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-md font-semibold">
            Overview Statistik Berdasarkan Periode Waktu
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Gunakan filter untuk melihat breakdown users, periode + child forum, dan data master.
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Pilih metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="periods">Periode & Child Forum</SelectItem>
              <SelectItem value="masters">Data Master</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedRange} onValueChange={setSelectedRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Bulan</SelectItem>
              <SelectItem value="3">3 Bulan</SelectItem>
              <SelectItem value="6">6 Bulan</SelectItem>
              <SelectItem value="12">12 Bulan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-xs text-gray-500 mb-3">{METRIC_LABELS[selectedMetric] || '-'}</p>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: selectedRange === '1' ? 20 : 45 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#374151', fontSize: 12 }}
                angle={selectedRange === '1' ? 0 : -45}
                textAnchor={selectedRange === '1' ? 'middle' : 'end'}
                height={selectedRange === '1' ? 40 : 60}
              />
              <YAxis tick={{ fill: '#374151', fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              {renderMetricSeries()}
            </ComposedChart>
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
        Total Child Forum: <span className="font-semibold">{item.totalChildForum}</span>
      </div>
    </div>
  )
}

const PeriodChildForumChart = ({ periods = [] }) => {
  const [sortBy, setSortBy] = useState('newest')
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
    const cloned = [...normalizedData]

    switch (sortBy) {
      case 'oldest':
        cloned.sort((a, b) => a.createdTime - b.createdTime)
        break
      case 'highest':
        cloned.sort((a, b) => b.totalChildForum - a.totalChildForum)
        break
      case 'lowest':
        cloned.sort((a, b) => a.totalChildForum - b.totalChildForum)
        break
      case 'newest':
      default:
        cloned.sort((a, b) => b.createdTime - a.createdTime)
        break
    }

    return cloned
  }, [normalizedData, sortBy])

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

  useEffect(() => {
    setPage(1)
  }, [sortBy, pageSize, periods])

  if (!normalizedData.length) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="text-md font-semibold">
            Total Child Forum per Forum Periode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center text-sm text-gray-500">
            Data forum periode belum tersedia
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
            Total Child Forum per Forum Periode
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Ditampilkan per halaman agar tetap rapi saat jumlah periode bertambah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Urutkan</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Pilih urutan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="oldest">Terlama</SelectItem>
                <SelectItem value="highest">Child terbanyak</SelectItem>
                <SelectItem value="lowest">Child tersedikit</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

export default function Dashboard() {
  const {
    usersData,
    userStats,
    statsData,
    periodsArray,
    documentMasterArray,
    isLoading,
    error,
  } = useDashboardData()

  const statsCards = [
    {
      title: 'Total Users',
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
      value: ensureArray(periodsArray).length,
      icon: Calendar,
      details: [
        { label: 'Total Periode', value: ensureArray(periodsArray).length },
        {
          label: 'Total Child Forum',
          value: ensureArray(periodsArray).reduce(
            (sum, period) => sum + Number(period?.forums_count || 0),
            0
          ),
        },
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
        <div className="p-6 bg-white min-h-screen">
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
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Beranda</h1>
          <p className="text-gray-500 mt-1">Ikhtisar statistik sistem dan aktivitas forum</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

        <div className="mb-6">
          <PeriodChildForumChart periods={periodsArray} />
        </div>
      </div>
    </MainLayout>
  )
}
