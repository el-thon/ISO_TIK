// pages/dashboard/index.jsx
import React, { useState, useMemo, useCallback } from 'react'
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
import {
  Users,
  Calendar,
  Database,
  TrendingUp,
  ArrowLeft,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  FolderTree,
  FileText,
  ChevronRight,
  X
} from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { useDashboardData } from '@/hooks/useDashboard'

// Helper function to ensure array
const ensureArray = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (data.data && Array.isArray(data.data)) return data.data
  if (data.items && Array.isArray(data.items)) return data.items
  return []
}

// Enhanced Stat Card
const StatCard = ({ title, value, icon: _Icon, details, trend, loading, isAlt = false }) => {
  // Some lint configs don't treat destructured rename as usage; ensure it's referenced.
  const Icon = _Icon
  return (
    <div className="h-full">
      <Card className={`border transition-all h-full ${
        isAlt
          ? 'bg-black border-gray-800 text-white hover:shadow-lg'
          : 'bg-white border-gray-200 text-gray-900 hover:shadow-md'
      }`}>
        <CardContent className="p-6 h-full flex flex-col">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${
                isAlt ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {title}
              </p>
              {loading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className={`text-3xl font-bold ${
                  isAlt ? 'text-white' : 'text-gray-900'
                }`}>
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
                      <span className={`font-medium ${
                        isAlt ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {detail.value?.toLocaleString() || 0}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              {trend && (
                <p className={`text-xs mt-2 flex items-center gap-1 ${
                  isAlt ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  {trend}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-full ${
              isAlt ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              <Icon className={`w-6 h-6 ${
                isAlt ? 'text-white' : 'text-gray-700'
              }`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Pie Chart Component
const OverviewPieChart = ({ users, periods, masters, onSliceClick }) => {
  const usersCount = ensureArray(users).length
  const periodsCount = ensureArray(periods).length
  const mastersCount = ensureArray(masters).length
  
  const data = [
    { name: 'Total Users', value: usersCount, color: '#06b6d4', key: 'users' },
    { name: 'Total Forum', value: periodsCount, color: '#7c3aed', key: 'forum' },
    { name: 'Data Master', value: mastersCount, color: '#f97316', key: 'masters' }
  ]

  const handleClick = (entry) => {
    if (onSliceClick) {
      onSliceClick(entry.payload.key)
    }
  }

  return (
    <Card className="border border-gray-200 h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5" />
          Overview Statistik
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                onClick={handleClick}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [value?.toLocaleString() || 0, 'Jumlah']}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          {data.map((item, idx) => (
            <div 
              key={idx} 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onSliceClick && onSliceClick(item.key)}
            >
              <div className="text-2xl font-bold" style={{ color: item.color }}>
                {item.value.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">{item.name}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper to get days in current month (used for 1 month / daily buckets)
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
    days.push({ start: new Date(dayStart), end: new Date(dayEnd), label: `${yyyy}-${mm}-${dd}` })
  }
  return days
}

// Helper to get months
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

// Custom Dot Component for clickable dots
const CustomDot = (props) => {
  const { cx, cy, stroke, payload, dataKey, onClick } = props
  
  const handleClick = (e) => {
    e.stopPropagation()
    if (onClick) {
      onClick(dataKey, payload)
    }
  }
  
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill={stroke}
      stroke="#fff"
      strokeWidth={2}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.setAttribute('r', 8)
      }}
      onMouseLeave={(e) => {
        e.currentTarget.setAttribute('r', 6)
      }}
    />
  )
}

// Custom Tooltip with click handler
const CustomTooltip = ({ active, payload, label, onItemClick }) => {
  if (!active || !payload || !payload.length) return null

  const nameMap = {
    Users: 'Pengguna',
    Forum: 'Forum',
    'Data Master': 'Data Master'
  }

  const items = payload.map(p => ({
    name: nameMap[p.dataKey] || p.dataKey,
    value: p.value,
    color: p.color || p.stroke,
    dataKey: p.dataKey
  }))

  return (
    <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700 min-w-[180px]">
      <div className="text-xs opacity-70 mb-2 border-b border-gray-700 pb-1">{label}</div>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="flex justify-between items-center gap-4 py-1 cursor-pointer hover:bg-gray-800 rounded px-1 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onItemClick(item.dataKey)
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-sm">{item.name}</span>
          </div>
          <span className="text-sm font-semibold">{item.value?.toLocaleString() || 0}</span>
        </div>
      ))}
    </div>
  )
}

// Line Chart Component with clickable dots
const StatsChart = ({ users = [], periods = [], masters = [], onItemClick }) => {
  const [selectedRange, setSelectedRange] = useState('1')

  const safeGetDate = (item) => {
    const d = item?.created_at || item?.createdAt || item?.createdAtDate || item?.created || null
    if (!d) return null
    const parsed = new Date(d)
    return !isNaN(parsed.getTime()) ? parsed : null
  }

  const buckets = useMemo(() => {
    if (selectedRange === '1') {
      return getDaysInCurrentMonth()
    }
    return getMonths(parseInt(selectedRange))
  }, [selectedRange])

  const countByBucket = useCallback((items) => {
    const arr = ensureArray(items)
    return buckets.map((bucket) => {
      let count = 0
      for (const item of arr) {
        const itemDate = safeGetDate(item)
        if (!itemDate) continue
        
        if (selectedRange === '1') {
          if (itemDate >= bucket.start && itemDate <= bucket.end) count++
        } else {
          if (itemDate.getFullYear() === bucket.start.getFullYear() && 
              itemDate.getMonth() === bucket.start.getMonth()) count++
        }
      }
      return count
    })
  }, [buckets, selectedRange])

  const forumCounts = useMemo(() => {
    const arr = ensureArray(periods)
    return buckets.map((bucket) => {
      let sum = 0
      for (const p of arr) {
        const pd = safeGetDate(p)
        if (!pd) continue
        if (selectedRange === '1') {
          if (pd >= bucket.start && pd <= bucket.end) sum += 1
        } else {
          if (pd.getFullYear() === bucket.start.getFullYear() && 
              pd.getMonth() === bucket.start.getMonth()) sum += 1
        }
      }
      return sum
    })
  }, [periods, buckets, selectedRange])

  const userCounts = useMemo(() => countByBucket(users), [users, countByBucket])
  const masterCounts = useMemo(() => countByBucket(masters), [masters, countByBucket])

  const allData = buckets.map((bucket, idx) => ({
    name: bucket.label,
    Users: userCounts[idx] || 0,
    Forum: forumCounts[idx] || 0,
    'Data Master': masterCounts[idx] || 0,
    bucketData: bucket
  }))

  const colors = {
    Users: '#06b6d4',
    Forum: '#7c3aed',
    'Data Master': '#f97316'
  }

  const isWeekly = selectedRange === '1'

  // Handle dot click
  const handleDotClick = (dataKey) => {
    if (onItemClick) {
      onItemClick(dataKey)
    }
  }

  return (
    <Card className="border border-gray-200 h-full">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Statistik Perkembangan Data
        </CardTitle>
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
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={allData} 
              margin={{ top: 20, right: 30, left: 20, bottom: isWeekly ? 40 : 60 }}
            >
              <CartesianGrid strokeDasharray="4 6" stroke="#F3F4F6" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#374151', fontSize: 12 }}
                interval={0}
                angle={isWeekly ? 0 : -45}
                textAnchor={isWeekly ? 'middle' : 'end'}
                height={isWeekly ? 40 : 60}
              />
              <YAxis tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip 
                content={(props) => (
                  <CustomTooltip {...props} onItemClick={onItemClick} />
                )} 
              />
              <Legend />
              
              <Line 
                type="monotone" 
                dataKey="Users" 
                name="Pengguna"
                stroke={colors.Users} 
                strokeWidth={2.5} 
                dot={(props) => <CustomDot {...props} dataKey="Users" onClick={handleDotClick} />}
                activeDot={(props) => <CustomDot {...props} dataKey="Users" onClick={handleDotClick} r={8} />}
                isAnimationActive={true}
              />
              <Line 
                type="monotone" 
                dataKey="Forum" 
                name="Forum"
                stroke={colors.Forum} 
                strokeWidth={2.5} 
                dot={(props) => <CustomDot {...props} dataKey="Forum" onClick={handleDotClick} />}
                activeDot={(props) => <CustomDot {...props} dataKey="Forum" onClick={handleDotClick} r={8} />}
                isAnimationActive={true}
              />
              <Line 
                type="monotone" 
                dataKey="Data Master" 
                name="Data Master"
                stroke={colors['Data Master']} 
                strokeWidth={2.5} 
                dot={(props) => <CustomDot {...props} dataKey="Data Master" onClick={handleDotClick} />}
                activeDot={(props) => <CustomDot {...props} dataKey="Data Master" onClick={handleDotClick} r={8} />}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-center text-xs text-gray-500">
          <p>Klik pada titik (dot) di chart atau pada item di tooltip untuk melihat detail</p>
        </div>
      </CardContent>
    </Card>
  )
}

// Child Forum Bar Chart Component
const ChildForumChart = ({ childForums, onChildSelect }) => {
  const data = ensureArray(childForums).map(child => ({
    name: child.name?.length > 20 ? child.name.substring(0, 20) + '...' : (child.name || 'Unnamed'),
    formulir: child.formulir_count || 0,
    id: child.id,
    fullName: child.name || 'Unnamed'
  }))

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FolderTree className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Tidak ada child forum untuk periode ini</p>
      </div>
    )
  }

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-4">Distribusi Formulir per Child Forum</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#666666', fontSize: 12 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fill: '#666666', fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderRadius: '8px'
            }}
            labelFormatter={(label) => {
              const item = data.find(d => d.name === label)
              return item?.fullName || label
            }}
          />
          <Bar
            dataKey="formulir"
            fill="#7c3aed"
            radius={[4, 4, 0, 0]}
            onClick={(data) => onChildSelect(data.id)}
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Discrepancy Forms List Component
const DiscrepancyFormsList = ({ forms, loading }) => {
  const formsArray = ensureArray(forms)

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    )
  }

  if (formsArray.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Tidak ada formulir ketidaksesuaian untuk child forum ini</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {formsArray.map((form, index) => (
        <motion.div
          key={form.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{form.title || 'Formulir Ketidaksesuaian'}</h4>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {form.description || 'Tidak ada deskripsi'}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-600">
                  Clause: {form.clause_code || form.clause?.code || 'N/A'}
                </span>
                <span className="text-xs text-gray-600">
                  Created: {form.created_at ? new Date(form.created_at).toLocaleDateString() : 'N/A'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  form.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  form.status === 'approved' ? 'bg-green-100 text-green-800' :
                  form.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {form.status || 'Draft'}
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              Detail
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Main Forum Detail Panel with Hierarchy
const ForumDetailPanel = ({ periods, isOpen, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState(null)
  const [selectedChildForum, setSelectedChildForum] = useState(null)
  const [view, setView] = useState('periods')

  const periodsArray = ensureArray(periods)

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period)
    setView('childForums')
  }

  const handleChildSelect = (childForum) => {
    setSelectedChildForum(childForum)
    setView('forms')
  }

  const handleBack = () => {
    if (view === 'forms') {
      setView('childForums')
      setSelectedChildForum(null)
    } else if (view === 'childForums') {
      setView('periods')
      setSelectedPeriod(null)
    }
  }

  const handleReset = () => {
    setSelectedPeriod(null)
    setSelectedChildForum(null)
    setView('periods')
  }

  if (!isOpen) return null

  const childForums = selectedPeriod?.forums || []
  const discrepancyForms =
    selectedChildForum?.formulirs ||
    selectedChildForum?.forms ||
    selectedChildForum?.discrepancy_forms ||
    selectedChildForum?.topics ||
    []

  return (
    <Card className="border border-gray-200 mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== 'periods' && (
            <Button size="sm" variant="ghost" onClick={handleBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle className="text-lg font-semibold text-gray-900">
            {view === 'periods' && 'Detail Periode Forum'}
            {view === 'childForums' && `Child Forum - ${selectedPeriod?.name || 'Periode'}`}
            {view === 'forms' && `Formulir Ketidaksesuaian - ${selectedChildForum?.name || 'Child Forum'}`}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'periods' && (
            <Button size="sm" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {view === 'periods' && (
            <motion.div
              key="periods"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {periodsArray.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Tidak ada periode forum</p>
                </div>
              ) : (
                periodsArray.map((period) => (
                  <div
                    key={period.id}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
                    onClick={() => handlePeriodSelect(period)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{period.name}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <FolderTree className="w-4 h-4" />
                            {period.forums_count || period.forums?.length || 0} Child Forum
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {period.formulir_count || 0} Formulir
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {view === 'childForums' && selectedPeriod && (
            <motion.div
              key="childForums"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{selectedPeriod.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Total Child Forum: {selectedPeriod.forums_count || childForums.length} | 
                    Total Formulir: {selectedPeriod.formulir_count || 0}
                  </p>
                </div>
              </div>

              <ChildForumChart
                childForums={childForums}
                onChildSelect={handleChildSelect}
              />

              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Daftar Child Forum</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ensureArray(childForums).map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleChildSelect(child)}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{child.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Formulir: {child.formulir_count || child.formulirs?.length || child.forms?.length || child.topics?.length || 0}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'forms' && selectedChildForum && (
            <motion.div
              key="forms"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900">{selectedChildForum.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Total Formulir Ketidaksesuaian: {discrepancyForms.length}
                  </p>
                </div>
              </div>

              <DiscrepancyFormsList forms={discrepancyForms} loading={false} />
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { usersData, userStats, statsData, periodsArray, documentMasterArray, isLoading, error } = useDashboardData()
  const [showForumDetail, setShowForumDetail] = useState(false)
  const [selectedSeries, setSelectedSeries] = useState(null)

  const handleItemClick = (dataKey) => {
    if (dataKey === 'Users') {
      setSelectedSeries('users')
      setShowForumDetail(false)
    } else if (dataKey === 'Forum') {
      setSelectedSeries('forum')
      setShowForumDetail(true)
    } else if (dataKey === 'Data Master') {
      setSelectedSeries('masters')
      setShowForumDetail(false)
    }
  }

  const handleCloseForumDetail = () => {
    setShowForumDetail(false)
    if (selectedSeries === 'forum') {
      setSelectedSeries(null)
    }
  }

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

  const statsCards = [
    {
      title: 'Total Users',
      value: userStats.total,
      icon: Users,
      details: [
        { label: 'Pengguna Aktif', value: userStats.active },
        { label: 'Pengguna Non-aktif', value: userStats.inactive }
      ],
      trend: statsData?.user_growth ? `+${statsData.user_growth}% growth` : null,
    },
    {
      title: 'Periode',
      value: periodsArray.length,
      icon: Calendar,
      details: [
        { label: 'Total Periode', value: periodsArray.length },
        { label: 'Total Formulir', value: periodsArray.reduce((sum, p) => sum + (p.formulir_count || 0), 0) }
      ],
    },
    {
      title: 'Data Master',
      value: documentMasterArray.length,
      icon: Database,
      details: [
        { label: 'Aktif', value: documentMasterArray.filter(d => d.is_active).length },
        { label: 'Nonaktif', value: documentMasterArray.filter(d => !d.is_active).length }
      ],
    }
  ]

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <OverviewPieChart
            users={usersData}
            periods={periodsArray}
            masters={documentMasterArray}
            onSliceClick={handleItemClick}
          />
          <StatsChart
            users={usersData}
            periods={periodsArray}
            masters={documentMasterArray}
            onItemClick={handleItemClick}
          />
        </div>

        <ForumDetailPanel
          periods={periodsArray}
          isOpen={showForumDetail}
          onClose={handleCloseForumDetail}
        />
      </div>
    </MainLayout>
  )
}
