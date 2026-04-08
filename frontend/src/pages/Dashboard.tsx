import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, LogIn, ShieldAlert, Activity, Clock, Building2 } from 'lucide-react';
import api from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import type { VisitStats, Visit } from '@/types';

export default function Dashboard() {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [activeVisits, setActiveVisits] = useState<Visit[]>([]);
  const [todayVisits, setTodayVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/visits/stats'),
      api.get('/visits/active'),
      api.get('/visits/today'),
    ]).then(([statsRes, activeRes, todayRes]) => {
      setStats(statsRes.data.stats);
      setActiveVisits(activeRes.data.visits || []);
      setTodayVisits(todayRes.data.visits || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" /></div>;

  const statCards = [
    { label: 'Active Visitors', value: stats?.active_visitors ?? 0, icon: Activity, color: 'text-green-600 bg-green-50' },
    { label: "Today's Check-ins", value: stats?.today_checkins ?? 0, icon: LogIn, color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Visitors', value: stats?.total_visitors ?? 0, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Blacklisted', value: stats?.blacklisted ?? 0, icon: ShieldAlert, color: 'text-red-600 bg-red-50' },
  ];

  const getDuration = (checkIn: string) => {
    const diff = Date.now() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Visitor Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.last_7_days || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Visitors" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-500" /> Active Visitors ({activeVisits.length})
          </h3>
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {activeVisits.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No active visitors</p>}
            {activeVisits.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{v.visitor_name}</p>
                  <p className="text-xs text-gray-500">Host: {v.host_name} {v.visitor_company ? `| ${v.visitor_company}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-green-600 flex items-center gap-1"><Clock className="h-3 w-3" /> {getDuration(v.check_in)}</p>
                  <p className="text-[10px] text-gray-400">{v.pass_number}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Today's Timeline</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {todayVisits.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No visits today</p>}
          {todayVisits.map(v => (
            <div key={v.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`h-2 w-2 rounded-full shrink-0 ${v.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{v.visitor_name}</p>
                <p className="text-xs text-gray-500">{v.purpose} - {v.host_name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono text-gray-600">{formatTime(v.check_in)}</p>
                {v.check_out ? (
                  <p className="text-[10px] text-gray-400">Out: {formatTime(v.check_out)}</p>
                ) : (
                  <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">IN</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
