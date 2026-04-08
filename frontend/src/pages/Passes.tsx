import { useState, useEffect } from 'react';
import { BadgeCheck, Search, Loader2, Clock, X } from 'lucide-react';
import api from '@/lib/api';
import { formatTime, formatDate } from '@/lib/utils';
import type { Visit } from '@/types';

export default function Passes() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPass, setSelectedPass] = useState<Visit | null>(null);

  useEffect(() => {
    api.get('/visits/today').then(r => setVisits(r.data.visits || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getStatus = (v: Visit) => {
    if (v.check_out) return 'completed';
    if (new Date(v.valid_until) < new Date()) return 'expired';
    return 'active';
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'text-green-600 bg-green-50';
    if (s === 'expired') return 'text-orange-600 bg-orange-50';
    return 'text-gray-500 bg-gray-100';
  };

  const filtered = visits.filter(v =>
    (v.visitor_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.pass_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.visitor_phone || '').includes(search)
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-accent" /> Today's Passes</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or pass number..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" />
      </div>

      <div className="flex gap-6">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => {
            const status = getStatus(v);
            return (
              <div key={v.id} onClick={() => setSelectedPass(v)} className="bg-white rounded-xl border p-4 hover:border-accent/50 cursor-pointer transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-medium text-primary">{v.pass_number}</span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase ${statusColor(status)}`}>{status}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{v.visitor_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{v.visitor_company || v.visitor_phone}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                  <span>In: {formatTime(v.check_in)}</span>
                  <span>{v.check_out ? `Out: ${formatTime(v.check_out)}` : 'Still in'}</span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-gray-400 text-sm col-span-full text-center py-12">No passes found for today</p>}
        </div>

        {selectedPass && (
          <div className="w-80 shrink-0">
            <div className="bg-white rounded-xl border-2 border-primary p-5 sticky top-0 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 uppercase font-medium">Visitor Pass</p>
                <button onClick={() => setSelectedPass(null)}><X className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <div className="text-center border-b pb-3">
                <p className="text-xl font-bold text-primary tracking-wider">{selectedPass.pass_number}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase mt-1 inline-block ${statusColor(getStatus(selectedPass))}`}>{getStatus(selectedPass)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500 text-xs">Visitor</p><p className="font-medium">{selectedPass.visitor_name}</p></div>
                <div><p className="text-gray-500 text-xs">Phone</p><p className="font-medium">{selectedPass.visitor_phone}</p></div>
                <div><p className="text-gray-500 text-xs">Host</p><p className="font-medium">{selectedPass.host_name}</p></div>
                <div><p className="text-gray-500 text-xs">Purpose</p><p className="font-medium">{selectedPass.purpose}</p></div>
                <div><p className="text-gray-500 text-xs">Check-in</p><p className="font-medium">{formatTime(selectedPass.check_in)}</p></div>
                <div><p className="text-gray-500 text-xs">Check-out</p><p className="font-medium">{selectedPass.check_out ? formatTime(selectedPass.check_out) : '-'}</p></div>
                <div><p className="text-gray-500 text-xs">Valid Until</p><p className="font-medium">{formatTime(selectedPass.valid_until)}</p></div>
                <div><p className="text-gray-500 text-xs">Date</p><p className="font-medium">{formatDate(selectedPass.check_in)}</p></div>
              </div>
              {selectedPass.vehicle_number && (
                <div className="text-sm"><p className="text-gray-500 text-xs">Vehicle</p><p className="font-medium">{selectedPass.vehicle_number}</p></div>
              )}
              {selectedPass.items_carried && (
                <div className="text-sm"><p className="text-gray-500 text-xs">Items Carried</p><p className="font-medium">{selectedPass.items_carried}</p></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
