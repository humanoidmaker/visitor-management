import { useState, useEffect } from 'react';
import { BarChart3, Loader2, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type { VisitStats } from '@/types';

const PIE_COLORS = ['#0ea5e9', '#1e3a5f', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.get('/visits/stats').then(r => setStats(r.data.stats)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/visits/export-csv?from=${fromDate}&to=${toDate}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `visits_${fromDate}_to_${toDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-accent" /> Reports</h2>
        <div className="flex items-center gap-3">
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" />
          <span className="text-gray-400">to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" />
          <button onClick={exportCSV} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Visitor Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats?.last_7_days || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9' }} name="Visitors" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Department-wise Visits (Today)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats?.department_stats || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="department" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" fill="#1e3a5f" radius={[0, 4, 4, 0]} name="Visits" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Peak Hours (Today)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={(stats?.hour_stats || []).map(h => ({ ...h, label: `${h.hour}:00` }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Visitors" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Purpose Distribution (Today)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={stats?.purpose_stats || []} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="count" nameKey="purpose" label={({ purpose, count }) => `${purpose}: ${count}`} labelLine={false}>
                {(stats?.purpose_stats || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Frequent Visitors (All Time)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">#</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Company</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Total Visits</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.frequent_visitors || []).map((fv, i) => (
                <tr key={fv.visitor_id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{fv.name}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">{fv.company || '-'}</td>
                  <td className="px-4 py-2.5"><span className="text-sm font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">{fv.count}</span></td>
                </tr>
              ))}
              {(stats?.frequent_visitors || []).length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">No visit data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
