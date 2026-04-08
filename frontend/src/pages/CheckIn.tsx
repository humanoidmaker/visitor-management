import { useState, useEffect, useRef, useCallback } from 'react';
import { LogIn, Search, Loader2, Camera, X, UserPlus, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Host, Visit, Visitor } from '@/types';

export default function CheckIn() {
  const [step, setStep] = useState<'search' | 'form' | 'pass'>('search');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Visitor[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [idType, setIdType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [photo, setPhoto] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  const [hosts, setHosts] = useState<Host[]>([]);
  const [hostSearch, setHostSearch] = useState('');
  const [selectedHost, setSelectedHost] = useState<Host | null>(null);
  const [purpose, setPurpose] = useState('Meeting');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [itemsCarried, setItemsCarried] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatedPass, setGeneratedPass] = useState<Visit | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    api.get('/hosts').then(r => setHosts(r.data.hosts || [])).catch(() => {});
  }, []);

  const searchVisitor = useCallback(async () => {
    if (!phoneSearch.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get(`/visitors/search?q=${phoneSearch}`);
      setSearchResults(data.visitors || []);
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  }, [phoneSearch]);

  const selectExisting = (v: Visitor) => {
    setSelectedVisitor(v);
    setName(v.name);
    setPhone(v.phone);
    setEmail(v.email);
    setCompany(v.company);
    setIdType(v.id_type || 'aadhaar');
    setIdNumber(v.id_number);
    setPhoto(v.photo);
    setStep('form');
  };

  const startNew = () => {
    setSelectedVisitor(null);
    setName('');
    setPhone(phoneSearch);
    setEmail('');
    setCompany('');
    setIdType('aadhaar');
    setIdNumber('');
    setPhoto('');
    setStep('form');
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { toast.error('Camera access denied'); setShowCamera(false); }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = 320;
    canvasRef.current.height = 240;
    ctx?.drawImage(videoRef.current, 0, 0, 320, 240);
    setPhoto(canvasRef.current.toDataURL('image/jpeg', 0.7));
    stopCamera();
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  const filteredHosts = hosts.filter(h =>
    h.name.toLowerCase().includes(hostSearch.toLowerCase()) ||
    h.department.toLowerCase().includes(hostSearch.toLowerCase())
  );

  const handleCheckin = async () => {
    if (!selectedHost) { toast.error('Please select a host'); return; }
    if (!name || !phone) { toast.error('Name and phone are required'); return; }
    setSubmitting(true);
    try {
      const payload: any = {
        host_id: selectedHost.id,
        purpose,
        vehicle_number: vehicleNumber,
        items_carried: itemsCarried,
      };
      if (selectedVisitor) {
        payload.visitor_id = selectedVisitor.id;
      } else {
        payload.name = name;
        payload.phone = phone;
        payload.email = email;
        payload.company = company;
        payload.id_type = idType;
        payload.id_number = idNumber;
        payload.photo = photo;
      }
      const { data } = await api.post('/visits/checkin', payload);
      setGeneratedPass(data.visit);
      setStep('pass');
      toast.success('Check-in successful!');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Check-in failed');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setStep('search');
    setPhoneSearch('');
    setSearchResults([]);
    setSelectedVisitor(null);
    setSelectedHost(null);
    setGeneratedPass(null);
    setName(''); setPhone(''); setEmail(''); setCompany('');
    setIdType('aadhaar'); setIdNumber(''); setPhoto('');
    setVehicleNumber(''); setItemsCarried('');
    setPurpose('Meeting');
  };

  if (step === 'pass' && generatedPass) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-gray-900">Visitor Pass Generated</h2>
        </div>
        <div className="bg-white rounded-xl border-2 border-primary p-6 space-y-4">
          <div className="text-center border-b pb-4">
            <p className="text-2xl font-bold text-primary tracking-wider">{generatedPass.pass_number}</p>
            <p className="text-xs text-gray-500 mt-1">VISITOR PASS</p>
          </div>
          {generatedPass.visitor_photo && (
            <div className="flex justify-center">
              <img src={generatedPass.visitor_photo} alt="Visitor" className="w-24 h-24 rounded-lg object-cover border" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-gray-500 text-xs">Visitor</p><p className="font-medium">{generatedPass.visitor_name}</p></div>
            <div><p className="text-gray-500 text-xs">Phone</p><p className="font-medium">{generatedPass.visitor_phone}</p></div>
            <div><p className="text-gray-500 text-xs">Company</p><p className="font-medium">{generatedPass.visitor_company || '-'}</p></div>
            <div><p className="text-gray-500 text-xs">Purpose</p><p className="font-medium">{generatedPass.purpose}</p></div>
            <div><p className="text-gray-500 text-xs">Host</p><p className="font-medium">{generatedPass.host_name}</p></div>
            <div><p className="text-gray-500 text-xs">Department</p><p className="font-medium">{generatedPass.host_department || '-'}</p></div>
            <div><p className="text-gray-500 text-xs">Check-in</p><p className="font-medium">{formatTime(generatedPass.check_in)}</p></div>
            <div><p className="text-gray-500 text-xs">Valid Until</p><p className="font-medium">{formatTime(generatedPass.valid_until)}</p></div>
          </div>
          {generatedPass.vehicle_number && (
            <div className="text-sm"><p className="text-gray-500 text-xs">Vehicle</p><p className="font-medium">{generatedPass.vehicle_number}</p></div>
          )}
        </div>
        <button onClick={resetForm} className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90">New Check-in</button>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><LogIn className="h-5 w-5 text-accent" /> Check In Visitor</h2>
          <button onClick={() => setStep('search')} className="text-sm text-gray-500 hover:text-gray-700">Back to Search</button>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-medium text-gray-900 text-sm">Visitor Details {selectedVisitor && <span className="text-green-600">(Returning visitor)</span>}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Company</label><input type="text" value={company} onChange={e => setCompany(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">ID Type</label>
              <select value={idType} onChange={e => setIdType(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none bg-white">
                <option value="aadhaar">Aadhaar</option><option value="pan">PAN</option><option value="driving_license">Driving License</option><option value="passport">Passport</option>
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">ID Number</label><input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Photo</label>
            <div className="flex items-center gap-3">
              {photo ? (
                <div className="relative"><img src={photo} alt="Photo" className="w-20 h-20 rounded-lg object-cover border" /><button onClick={() => setPhoto('')} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X className="h-3 w-3" /></button></div>
              ) : (
                <button onClick={startCamera} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"><Camera className="h-4 w-4" /> Capture Photo</button>
              )}
            </div>
            {showCamera && (
              <div className="mt-2 space-y-2">
                <video ref={videoRef} autoPlay playsInline className="w-80 rounded-lg border" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2">
                  <button onClick={capturePhoto} className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm">Capture</button>
                  <button onClick={stopCamera} className="px-3 py-1.5 border rounded-lg text-sm text-gray-600">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h3 className="font-medium text-gray-900 text-sm">Visit Details</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Host *</label>
            <input type="text" value={hostSearch} onChange={e => { setHostSearch(e.target.value); setSelectedHost(null); }} placeholder="Search host by name or department..." className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" />
            {hostSearch && !selectedHost && (
              <div className="mt-1 border rounded-lg max-h-40 overflow-y-auto">
                {filteredHosts.map(h => (
                  <button key={h.id} onClick={() => { setSelectedHost(h); setHostSearch(h.name); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex items-center justify-between">
                    <span>{h.name} <span className="text-gray-400">- {h.designation}</span></span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{h.department}</span>
                  </button>
                ))}
                {filteredHosts.length === 0 && <p className="text-xs text-gray-400 p-3">No hosts found</p>}
              </div>
            )}
            {selectedHost && <p className="text-xs text-green-600 mt-1">{selectedHost.name} - {selectedHost.department} ({selectedHost.designation})</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Purpose</label>
              <select value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none bg-white">
                {['Meeting', 'Interview', 'Delivery', 'Maintenance', 'Personal', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Number</label><input type="text" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="e.g. KA01AB1234" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Items Carried</label><input type="text" value={itemsCarried} onChange={e => setItemsCarried(e.target.value)} placeholder="e.g. Laptop, Documents" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" /></div>
        </div>

        <button onClick={handleCheckin} disabled={submitting} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} {submitting ? 'Processing...' : 'Generate Pass & Check In'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><LogIn className="h-5 w-5 text-accent" /> Visitor Check In</h2>
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <p className="text-sm text-gray-600">Search existing visitor by phone or name</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchVisitor()} placeholder="Phone number or name..." className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-accent/30 outline-none" />
          </div>
          <button onClick={searchVisitor} disabled={searching} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Found {searchResults.length} visitor(s)</p>
            {searchResults.map(v => (
              <button key={v.id} onClick={() => selectExisting(v)} className="w-full text-left p-3 border rounded-lg hover:border-accent transition-colors">
                <p className="text-sm font-medium text-gray-900">{v.name}</p>
                <p className="text-xs text-gray-500">{v.phone} {v.company ? `| ${v.company}` : ''} {v.visit_count > 1 ? <span className="text-accent font-medium ml-1">Repeat visitor ({v.visit_count})</span> : ''}</p>
              </button>
            ))}
          </div>
        )}

        <div className="border-t pt-4">
          <button onClick={startNew} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-accent hover:text-accent transition-colors">
            <UserPlus className="h-4 w-4" /> Register New Visitor
          </button>
        </div>
      </div>
    </div>
  );
}
