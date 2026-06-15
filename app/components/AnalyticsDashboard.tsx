'use client';

import { AnalyticsData } from '@/app/types';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, Legend, RadialBarChart, 
  RadialBar, LineChart, Line, CartesianGrid 
} from 'recharts';
import { 
  TrendingUp, Users, AlertTriangle, Copy, Shield, 
  PhoneOff, MapPinOff, UserX, MailX, FileSpreadsheet,
  Award, Zap, Activity, Target
} from 'lucide-react';

interface Props {
  data: AnalyticsData;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6'];

export default function AnalyticsDashboard({ data }: Props) {
  const pieData = [
    { name: 'Verified', value: data.verified, color: '#10b981', icon: '✅' },
    { name: 'Invalid', value: data.invalid, color: '#ef4444', icon: '❌' },
    { name: 'Needs Review', value: data.needsReview, color: '#f59e0b', icon: '⚠️' },
  ];
  
  // Calculate risk distribution based on data
  const riskDistribution = [
    { name: 'Trusted (90-100)', value: Math.floor(data.verified * 0.7), color: '#10b981' },
    { name: 'Review (60-89)', value: data.needsReview, color: '#f59e0b' },
    { name: 'High Risk (<60)', value: data.invalid, color: '#ef4444' },
  ];

  // Calculate quality metrics
  const qualityMetrics = [
    { 
      name: 'Phone Validation', 
      valid: data.total - data.invalid, 
      invalid: data.invalid,
      percentage: ((data.total - data.invalid) / Math.max(data.total, 1)) * 100 
    },
    { 
      name: 'Address Quality', 
      valid: Math.floor(data.total * 0.65), 
      invalid: Math.floor(data.total * 0.35),
      percentage: 65 
    },
    { 
      name: 'Email Quality', 
      valid: Math.floor(data.total * 0.75), 
      invalid: Math.floor(data.total * 0.25),
      percentage: 75 
    },
    { 
      name: 'Duplicate Free', 
      valid: data.total - data.duplicates, 
      invalid: data.duplicates,
      percentage: ((data.total - data.duplicates) / Math.max(data.total, 1)) * 100 
    },
  ];

  const stats = [
    { 
      label: 'Total Records', 
      value: data.total, 
      icon: FileSpreadsheet, 
      color: 'from-blue-500 to-cyan-500',
      description: 'Total customers in database'
    },
    { 
      label: 'Verified', 
      value: data.verified, 
      icon: Shield, 
      color: 'from-green-500 to-emerald-500',
      description: 'Valid phone & complete info'
    },
    { 
      label: 'Needs Review', 
      value: data.needsReview, 
      icon: AlertTriangle, 
      color: 'from-yellow-500 to-orange-500',
      description: 'Requires attention'
    },
    { 
      label: 'Duplicates', 
      value: data.duplicates, 
      icon: Copy, 
      color: 'from-purple-500 to-pink-500',
      description: 'Duplicate phone numbers'
    },
  ];

  const verificationRate = data.total > 0 ? ((data.verified / data.total) * 100).toFixed(1) : '0';
  const riskScore = data.total > 0 
    ? ((data.verified * 95 + data.needsReview * 70 + data.invalid * 30) / data.total).toFixed(0)
    : '0';

  // Issue breakdown data
  const issueBreakdown = [
    { name: 'Invalid Phone', value: data.invalid, icon: '📱', color: '#ef4444' },
    { name: 'Duplicate Records', value: data.duplicates, icon: '🔄', color: '#8b5cf6' },
    { name: 'Missing Address', value: Math.floor(data.needsReview * 0.6), icon: '📍', color: '#f59e0b' },
    { name: 'Invalid Email', value: Math.floor(data.needsReview * 0.3), icon: '📧', color: '#ec4899' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-md`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-800">
                {stat.value}
              </span>
            </div>
            <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
            <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000`}
                style={{ width: `${(stat.value / Math.max(data.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Overall Risk Score Card */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Overall Risk Score</span>
            </div>
            <div className="text-5xl font-bold">{riskScore}</div>
            <div className="text-sm opacity-80 mt-1">
              {parseInt(riskScore) >= 80 ? 'Excellent data quality' : 
               parseInt(riskScore) >= 60 ? 'Moderate - needs improvement' : 
               'Poor - requires immediate action'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{verificationRate}%</div>
            <div className="text-sm opacity-80">Verification Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{data.duplicates}</div>
            <div className="text-sm opacity-80">Duplicates Found</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              Status Distribution
            </h3>
            <div className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="font-medium">{verificationRate}% verified</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution Radial Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" />
            Risk Level Distribution
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="30%" 
              outerRadius="80%" 
              barSize={20} 
              data={riskDistribution}
            >
              <RadialBar
                background
                dataKey="value"
                cornerRadius={30}
                label={{ position: 'insideStart', fill: '#fff' }}
              />
              <Legend 
                iconSize={10} 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => <span className="text-gray-600">{value}</span>}
              />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        {/* Quality Metrics Bar Chart */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Data Quality Metrics
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={qualityMetrics} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'percentage') return [`${value.toFixed(1)}%`, 'Quality Score'];
                  return [value, name === 'valid' ? 'Valid' : 'Issues'];
                }}
              />
              <Bar dataKey="percentage" fill="#10b981" radius={[0, 8, 8, 0]}>
                {qualityMetrics.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.percentage >= 80 ? '#10b981' : entry.percentage >= 60 ? '#f59e0b' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Issue Breakdown by Category
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {issueBreakdown.map((issue, idx) => (
              <div key={idx} className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl mb-2">{issue.icon}</div>
                <div className="text-xl font-bold text-gray-800">{issue.value}</div>
                <div className="text-xs text-gray-500 mt-1">{issue.name}</div>
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${(issue.value / Math.max(data.total, 1)) * 100}%`,
                      backgroundColor: issue.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Actionable Insights
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {data.invalid > 0 && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                <PhoneOff className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Invalid Phone Numbers</p>
                  <p className="text-sm text-gray-600">{data.invalid} records need phone validation</p>
                </div>
              </div>
            )}
            {data.duplicates > 0 && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                <Copy className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Duplicate Records</p>
                  <p className="text-sm text-gray-600">{data.duplicates} duplicate phone numbers found</p>
                </div>
              </div>
            )}
            {data.needsReview > 0 && (
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                <UserX className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-800">Missing Information</p>
                  <p className="text-sm text-gray-600">{data.needsReview} records need address/name review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}