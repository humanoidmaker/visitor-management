import { useState, useEffect } from 'react';
import { LogOut, Search, Loader2, CheckCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { formatTime, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Visit } from '@/types';

export default function CheckOut() {
  const [activeVisits, setActiveVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [checkingOut, setCheckingOut] = useState<string | null>(null);

  const fetchActive = () => {
    setLoading(true);
    api.get('/visits/active').then(r => setActiveVisits(r.data.visits || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchActive(); }, []);

  const handleCheckout = async (visitId: string) => {
    setCheckingOut(visitId);
    try {
      await api.post(`/visits/checkout/${visitId}`);
      toast.success('Checked out successfully');
      fetchActive();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Checkout failed');
    } finally { setCheckingOut(null); }
  };

  const getDuration = (checkIn: string) => {
    const diff = Date.now() - new Date(checkIn).getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filtered = activeVisits.filter(v =>
    (v.visitor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.visitor_phone || '').includes(search) ||
    (v.pass_number || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><LogOut className="h-5 w-5 text-accent" /> Check Out</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or pass number..." className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <LogOut className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No active visitors to check out</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => (
            <div key={v.id} className="bg-white rounded-xl border p-5 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-gray-900">{v.visitor_name}</h3>
                  <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{v.pass_number}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                  <span>Phone: {v.visitor_phone}</span>
                  <span>Host: {v.host_name}</span>
                  <span>Purpose: {v.purpose}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Duration: {getDuration(v.check_in)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Checked in: {formatTime(v.check_in)} | {formatDate(v.check_in)}</p>
              </div>
              <button
                onClick={() => handleCheckout(v.id)}
                disabled={checkingOut === v.id}
                className="ml-4 flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 shrink-0"
              >
                {checkingOut === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {checkingOut === v.id ? 'Processing...' : 'Check Out'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
