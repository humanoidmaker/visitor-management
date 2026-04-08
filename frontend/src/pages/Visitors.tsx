import { useState, useEffect } from 'react';
import { Users, Search, Loader2, X, ChevronRight, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Visitor, Visit } from '@/types';

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchVisitors = (q = '') => {
    setLoading(true);
    api.get(`/visitors?q=${q}`).then(r => setVisitors(r.data.visitors || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchVisitors(); }, []);

  const handleSearch = () => { fetchVisitors(search); };

  const viewDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/visitors/${id}`);
      setSelectedVisitor(data.visitor);
    } catch { toast.error('Failed to load visitor details'); }
    finally { setDetailLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Users className="h-5 w-5 text-accent" /> Visitors</h2>
        <span className="text-sm text-gray-500">{visitors.length} total</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search by name, phone, email, company..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" />
        </div>
        <button onClick={handleSearch} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">Search</button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Phone</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Company</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Visits</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Last Visit</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {visitors.map(v => (
                  <tr key={v.id} onClick={() => viewDetail(v.id)} className="border-b hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{v.name}</p>
                      <p className="text-xs text-gray-400">{v.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.company || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{v.visit_count}</span>
                      {v.visit_count > 2 && <span className="ml-1.5 text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded"><RefreshCw className="h-2.5 w-2.5 inline mr-0.5" />Repeat</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{v.last_visit ? formatDate(v.last_visit) : '-'}</td>
                    <td className="px-2"><ChevronRight className="h-4 w-4 text-gray-300" /></td>
                  </tr>
                ))}
                {visitors.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No visitors found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedVisitor && (
          <div className="w-96 shrink-0">
            <div className="bg-white rounded-xl border p-5 sticky top-0 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{selectedVisitor.name}</h3>
                <button onClick={() => setSelectedVisitor(null)}><X className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>
              </div>
              {detailLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-gray-500 text-xs">Phone</p><p className="font-medium">{selectedVisitor.phone}</p></div>
                    <div><p className="text-gray-500 text-xs">Email</p><p className="font-medium text-xs">{selectedVisitor.email || '-'}</p></div>
                    <div><p className="text-gray-500 text-xs">Company</p><p className="font-medium">{selectedVisitor.company || '-'}</p></div>
                    <div><p className="text-gray-500 text-xs">ID</p><p className="font-medium text-xs">{selectedVisitor.id_type ? `${selectedVisitor.id_type.toUpperCase()}: ${selectedVisitor.id_number}` : '-'}</p></div>
                    <div><p className="text-gray-500 text-xs">Total Visits</p><p className="font-medium">{selectedVisitor.visit_count}</p></div>
                    <div><p className="text-gray-500 text-xs">Registered</p><p className="font-medium text-xs">{formatDate(selectedVisitor.created_at)}</p></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Visit History</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(selectedVisitor.visits || []).map((visit: Visit) => (
                        <div key={visit.id} className="p-2 bg-gray-50 rounded-lg text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-gray-600">{visit.pass_number}</span>
                            <span className={`font-medium px-1.5 py-0.5 rounded ${visit.status === 'active' ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>{visit.status}</span>
                          </div>
                          <p className="text-gray-500 mt-1">{visit.purpose} | Host: {visit.host_name || 'N/A'}</p>
                          <p className="text-gray-400">{formatDate(visit.check_in)}</p>
                        </div>
                      ))}
                      {(selectedVisitor.visits || []).length === 0 && <p className="text-gray-400 text-xs text-center py-4">No visit history</p>}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
