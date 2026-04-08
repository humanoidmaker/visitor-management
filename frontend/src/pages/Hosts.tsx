import { useState, useEffect } from 'react';
import { Building2, Plus, Search, Loader2, X, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import type { Host } from '@/types';

export default function Hosts() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Host | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: '', employee_id: '', department: '', phone: '', email: '', designation: '' });

  const fetchHosts = () => {
    setLoading(true);
    api.get(`/hosts?department=${filterDept}`).then(r => setHosts(r.data.hosts || [])).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchHosts(); }, [filterDept]);

  const departments = [...new Set(hosts.map(h => h.department))].sort();

  const filtered = hosts.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    h.designation.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = departments.reduce((acc, dept) => {
    const items = filtered.filter(h => h.department === dept);
    if (items.length > 0) acc[dept] = items;
    return acc;
  }, {} as Record<string, Host[]>);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', employee_id: '', department: '', phone: '', email: '', designation: '' });
    setShowModal(true);
  };

  const openEdit = (h: Host) => {
    setEditing(h);
    setForm({ name: h.name, employee_id: h.employee_id, department: h.department, phone: h.phone, email: h.email, designation: h.designation });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.employee_id || !form.department) { toast.error('Name, Employee ID, and Department are required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/hosts/${editing.id}`, form);
        toast.success('Host updated');
      } else {
        await api.post('/hosts', form);
        toast.success('Host created');
      }
      setShowModal(false);
      fetchHosts();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this host?')) return;
    try {
      await api.delete(`/hosts/${id}`);
      toast.success('Host deleted');
      fetchHosts();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Building2 className="h-5 w-5 text-accent" /> Hosts</h2>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90"><Plus className="h-4 w-4" /> Add Host</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hosts..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent/30 outline-none">
          <option value="">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center"><p className="text-gray-400">No hosts found</p></div>
      ) : (
        Object.entries(grouped).map(([dept, deptHosts]) => (
          <div key={dept}>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent"></span> {dept} ({deptHosts.length})
            </h3>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Name</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Employee ID</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Designation</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Phone</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-2">Email</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {deptHosts.map(h => (
                    <tr key={h.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{h.name}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600 font-mono">{h.employee_id}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{h.designation}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{h.phone}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{h.email}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(h)} className="p-1 text-gray-400 hover:text-accent"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(h.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{editing ? 'Edit Host' : 'Add Host'}</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Employee ID *</label><input type="text" value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Department *</label>
                <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-accent/30 outline-none">
                  <option value="">Select...</option>
                  {['Engineering', 'HR', 'Finance', 'Marketing', 'Admin', 'Management'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Designation</label><input type="text" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label><input type="text" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
