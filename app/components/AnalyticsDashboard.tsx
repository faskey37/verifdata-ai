'use client';

import { AnalyticsData } from '@/app/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, Users, AlertTriangle, Copy, Shield } from 'lucide-react';

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
  
  const stats = [
    { label: 'Total Records', value: data.total, icon: Users, color: 'from-blue-500 to-cyan-500' },
    { label: 'Verified', value: data.verified, icon: Shield, color: 'from-green-500 to-emerald-500' },
    { label: 'Needs Review', value: data.needsReview, icon: AlertTriangle, color: 'from-yellow-500 to-orange-500' },
    { label: 'Duplicates', value: data.duplicates, icon: Copy, color: 'from-purple-500 to-pink-500' },
  ];

  const verificationRate = data.total > 0 ? ((data.verified / data.total) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="stat-card group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-800 group-hover:scale-110 transition-transform">
                {stat.value}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000`}
                style={{ width: `${(stat.value / Math.max(data.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Status Distribution</h3>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>{verificationRate}% verified</span>
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
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Quality Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[
              { name: 'Valid Phone', value: data.total - data.invalid, total: data.total },
              { name: 'Complete Address', value: Math.floor(data.total * 0.7), total: data.total },
              { name: 'Valid Email', value: Math.floor(data.total * 0.8), total: data.total },
            ]}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]}>
                {[...Array(3)].map((_, i) => (
                  <Cell key={i} fill={`url(#gradient${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}