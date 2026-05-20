import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  MapPin, 
  Navigation, 
  CheckCircle, 
  Activity, 
  Play, 
  Square, 
  RefreshCw,
  LocateFixed,
  AlertCircle
} from 'lucide-react';
import { updateTracking } from '../../api/trackingApi';
import { useAuth } from '../../context/AuthContext';
import { extractErrorMessage } from '../../utils/formatters';
import toast from 'react-hot-toast';

// ── Constants ──────────────────────────────────────────────────────────────────
const UPDATE_INTERVAL = 5000; // 5 seconds
const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };

const UpdateLocationPage = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [orderId, setOrderId] = useState(searchParams.get('orderId') || '');
  const [partnerId, setPartnerId] = useState(searchParams.get('partnerId') || '');
  const [coords, setCoords]   = useState({ lat: BENGALURU_CENTER.lat, lng: BENGALURU_CENTER.lng });
  const coordsRef = useRef({ lat: BENGALURU_CENTER.lat, lng: BENGALURU_CENTER.lng });
  const [isAutoSync, setIsAutoSync] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(false);

  const syncTimerRef = useRef(null);
  const simTimerRef  = useRef(null);

  // Sync ref with state
  useEffect(() => {
    coordsRef.current = coords;
  }, [coords]);

  // ─── Core: Update Location API ───────────────────────────────────────────────
  const performSync = async () => {
    if (!orderId || !partnerId) return;
    const currentCoords = coordsRef.current;
    
    try {
      await updateTracking({
        orderId:   parseInt(orderId),
        partnerId: parseInt(partnerId || user?.id),
        latitude:  currentCoords.lat,
        longitude: currentCoords.lng,
        status:    'IN_TRANSIT'
      });
      setLastSync(new Date());
    } catch (err) {
      console.error('Sync failed:', err);
      if (!isAutoSync) toast.error(extractErrorMessage(err));
    }
  };

  // ─── Auto-Sync Logic ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAutoSync && orderId) {
      syncTimerRef.current = setInterval(() => {
        performSync();
      }, UPDATE_INTERVAL);
    } else {
      clearInterval(syncTimerRef.current);
    }
    return () => clearInterval(syncTimerRef.current);
  }, [isAutoSync, orderId]);

  // ─── Simulation Logic ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isSimulating) {
      simTimerRef.current = setInterval(() => {
        setCoords(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.002,
          lng: prev.lng + (Math.random() - 0.5) * 0.002
        }));
      }, 2000);
    } else {
      clearInterval(simTimerRef.current);
    }
    return () => clearInterval(simTimerRef.current);
  }, [isSimulating]);

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleManualSync = async () => {
    if (!orderId) { toast.error('Please enter an Order ID'); return; }
    if (!partnerId) { toast.error('Please enter the Delivery Partner ID from your assigned task'); return; }
    setLoading(true);
    await performSync();
    setLoading(false);
    toast.success('Location synced successfully!');
  };

  const handleGetActualLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Actual GPS location fetched!');
      },
      () => toast.error('Permission denied or GPS error')
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Control Panel */}
        <div className="flex-1 space-y-6">
          <header>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Navigation className="w-8 h-8 text-brand-green" />
              Live Tracking Hub
            </h1>
            <p className="text-gray-500 mt-2">Manage your real-time position updates</p>
          </header>

          <div className="card p-6 space-y-6 bg-white border-none shadow-premium">
            {/* Order Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Target Order ID</label>
              <div className="relative">
                <LocateFixed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. 8821"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all font-mono font-bold text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Delivery Partner ID</label>
              <div className="relative">
                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  placeholder="e.g. 4"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green outline-none transition-all font-mono font-bold text-lg"
                />
              </div>
            </div>

            {/* Coordinates Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Latitude</span>
                <p className="text-lg font-mono font-bold text-gray-800">{coords.lat.toFixed(6)}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Longitude</span>
                <p className="text-lg font-mono font-bold text-gray-800">{coords.lng.toFixed(6)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleManualSync}
                disabled={loading || !orderId}
                className="w-full py-4 bg-brand-green text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-green-dark transition-all disabled:opacity-50 shadow-lg shadow-brand-green/20"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Sync Current Position
              </button>
              
              <button 
                onClick={handleGetActualLocation}
                className="w-full py-3 bg-white border-2 border-brand-green text-brand-green rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-green/5 transition-all"
              >
                <MapPin className="w-5 h-5" />
                Get Real GPS Data
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Status & Automations */}
        <div className="w-full lg:w-80 space-y-6">
          
          {/* Status Monitor */}
          <div className="card p-6 bg-gray-900 text-white border-none overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tracking Status</span>
                <div className={`w-3 h-3 rounded-full ${isAutoSync ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Sync Engine</p>
                    <p className="font-bold">{isAutoSync ? 'Active & Pinging' : 'Standby'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <RefreshCw className={`w-5 h-5 ${isAutoSync ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Last Successful Sync</p>
                    <p className="font-bold text-sm">
                      {lastSync ? lastSync.toLocaleTimeString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Background Decoration */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-green/10 rounded-full blur-3xl" />
          </div>

          {/* Automation Toggles */}
          <div className="card p-4 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group"
                 onClick={() => setIsAutoSync(!isAutoSync)}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isAutoSync ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  <RefreshCw className={`w-5 h-5 ${isAutoSync ? 'animate-spin-slow' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Auto-Sync</p>
                  <p className="text-[10px] text-gray-400">Pings every 5s</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-all ${isAutoSync ? 'bg-brand-green' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAutoSync ? 'left-7' : 'left-1'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group"
                 onClick={() => setIsSimulating(!isSimulating)}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSimulating ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                  {isSimulating ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Simulation</p>
                  <p className="text-[10px] text-gray-400">Drift coordinates</p>
                </div>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-all ${isSimulating ? 'bg-blue-500' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isSimulating ? 'left-7' : 'left-1'}`} />
              </div>
            </div>
          </div>

          {/* Alert */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Keep this tab open for live tracking to remain active while you are in transit.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UpdateLocationPage;
