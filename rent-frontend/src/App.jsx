import React, { useState, useEffect, useMemo } from 'react';
import { Activity, ShieldCheck, Database, RefreshCw, Home, Store, X, FileText, MessageCircle, Settings, Save, Plus, Trash2, Building2, LogOut, ChevronDown, ArrowLeft, Globe, ChevronRight, LayoutDashboard, Target, Zap, Fingerprint, Lock, Key, BarChart3, TrendingUp, MapPin, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// ==========================================
// PURE UI SUB-COMPONENTS
// ==========================================

const ClientGateway = ({ 
  clientAccessCode, 
  setClientAccessCode, 
  clientPassword, 
  setClientPassword, 
  handleClientAccess, 
  handleAppLogout,
  user
}) => (
  <div className="min-h-screen bg-[#050505] flex text-white relative">
    <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
      <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover" alt="" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-20 left-20 z-10">
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-4 drop-shadow-lg">NoMad<span className="text-[#FFBF00]">Nest</span></h1>
          <p className="text-[#FFBF00] text-[10px] font-black uppercase tracking-[0.4em]">Client Authentication Portal</p>
      </div>
    </div>
    <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#FFBF00]/5 rounded-full blur-[100px] pointer-events-none"></div>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 w-full max-w-md bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/10 rounded-[3rem] p-12 shadow-2xl text-center">
        <div className="mx-auto w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 text-[#FFBF00] shadow-lg"><Lock size={32} /></div>
        <h2 className="text-3xl font-black italic uppercase text-white mb-2 tracking-tighter">Access Gateway</h2>
        <p className="text-gray-500 text-[9px] uppercase tracking-[0.2em] font-black mb-10 flex items-center justify-center gap-2"><ShieldCheck size={12}/> Authenticated: {user?.email}</p>
        <div className="space-y-4">
            <div className="relative">
                <Key size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={clientAccessCode} onChange={(e) => setClientAccessCode(e.target.value)} placeholder="Enter Property ID or Mobile" className="w-full bg-black border-2 border-white/5 rounded-[2rem] py-5 pl-16 pr-6 text-white text-sm font-bold tracking-widest outline-none focus:border-[#FFBF00]/50 transition-colors shadow-inner" />
            </div>
            <div className="relative">
                <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="password" value={clientPassword} onChange={(e) => setClientPassword(e.target.value)} placeholder="Enter Access Password" className="w-full bg-black border-2 border-white/5 rounded-[2rem] py-5 pl-16 pr-6 text-white text-sm font-bold tracking-widest outline-none focus:border-[#FFBF00]/50 transition-colors shadow-inner" />
            </div>
            <button onClick={handleClientAccess} className="w-full bg-[#FFBF00] text-black font-black py-5 rounded-[2rem] uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] transition-all shadow-[0_10px_40px_rgba(255,191,0,0.2)] mt-2">Connect to Asset</button>
        </div>
        <button onClick={handleAppLogout} className="mt-10 text-gray-600 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"><LogOut size={14}/> Secure Disconnect</button>
      </motion.div>
    </div>
  </div>
);

const NotificationPanel = ({ tickets, handleResolveTicket }) => (
  <div className="absolute top-16 right-0 w-80 bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 shadow-2xl z-[500] max-h-[400px] overflow-y-auto animate-in fade-in slide-in-from-top-4">
    <h4 className="text-[10px] font-black uppercase text-[#FFBF00] mb-4 flex items-center gap-2 border-b border-white/5 pb-3"><Bell size={12}/> Service Pipeline</h4>
    {tickets.length === 0 ? <p className="text-gray-600 text-[10px] text-center py-6 italic font-medium">All properties operating at 100% capacity.</p> : 
      tickets.map(t => (
        <div key={t.id} className="border-b border-white/5 py-4 last:border-0 group">
          <div className="flex justify-between items-start mb-1">
            <span className="text-white text-[11px] font-black">Unit {t.unitNumber}</span>
            <span className="text-[8px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded font-black uppercase tracking-tighter">{t.category}</span>
          </div>
          <p className="text-gray-500 text-[10px] mb-3 leading-relaxed">{t.description}</p>
          <button onClick={() => handleResolveTicket(t.id)} className="text-[9px] font-black uppercase text-green-500 hover:text-white transition-colors flex items-center gap-1.5"><CheckCircle size={12}/> Confirm Resolution</button>
        </div>
      ))
    }
  </div>
);

// ==========================================
// MAIN APP COMPONENT
// ==========================================

const App = () => {
  // --- CORE APP STATE ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('landing'); 
  const [isAdmin, setIsAdmin] = useState(false); 
  const [isTenant, setIsTenant] = useState(false);
  const [activeTenantData, setActiveTenantData] = useState(null);
  
  const AUTHORIZED_ADMINS = [
    "saitejagangireddi@gmail.com",
    "anushagundumalla@gmail.com",
  ];

  const MASTER_DB_OWNER = "saitejagangireddi@gmail.com"; 
  const isSuperAdmin = user && AUTHORIZED_ADMINS.includes(user.email);

  // --- DATA STATES ---
  const [houses, setHouses] = useState([]);
  const [activeHouse, setActiveHouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- FORM STATES ---
  const [isAddingHouse, setIsAddingHouse] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editData, setEditData] = useState(null);
  const [newHouse, setNewHouse] = useState({ id: '', name: '', password: '' });
  const [newRoom, setNewRoom] = useState({ unitNumber: '', floor: '', monthlyRent: '', tenantPhone: '', tenantName: '', password: '' });
  const [issueData, setIssueData] = useState({ category: 'Electrician', description: '' });
  
  const [clientAccessCode, setClientAccessCode] = useState('');
  const [clientPassword, setClientPassword] = useState('');

  const ISSUE_CATEGORIES = ["Electrician", "Plumber", "Carpenter", "Painter", "Cleaning", "Internet", "Water", "Other"];
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sturdy-spoon-4pwqxj59r593qqg9-8080.app.github.dev";

  // --- AUTH LISTENER & ROUTING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isActuallyAdmin = AUTHORIZED_ADMINS.includes(currentUser.email);
        if (!isActuallyAdmin) {
          setCurrentView('client_gateway');
          setActiveHouse(null); 
        } else if (currentView === 'landing') {
          setCurrentView('portfolio');
        }
      } else {
        setCurrentView('landing');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // --- CLOUD SYNC ---
  useEffect(() => { if (user) fetchHouses(); }, [user]);
  useEffect(() => { if (user && activeHouse) fetchUnits(activeHouse.id); }, [user, activeHouse?.id]);

  const fetchHouses = () => {
    setLoading(true); 
    fetch(`${API_BASE_URL}/api/houses/owner/${MASTER_DB_OWNER}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setHouses(data);
          setLoading(false);
        } else {
          setTimeout(fetchHouses, 3000);
        }
      })
      .catch(() => setTimeout(fetchHouses, 3000));
  };
  
  const fetchUnits = (houseId) => {
    if (!houseId) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/units/owner/${MASTER_DB_OWNER}/house/${houseId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { 
        setRooms(Array.isArray(data) ? data : []); 
        setLoading(false); 
      })
      .catch(() => { 
        setTimeout(() => fetchUnits(houseId), 3000);
      });

    fetch(`${API_BASE_URL}/api/tickets/house/${houseId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setTickets(data))
      .catch(err => console.error(err));
  };

  // --- HANDLERS ---
  const handleClientAccess = () => {
    const code = clientAccessCode.trim();
    const pass = clientPassword.trim();

    if (/^\d{10}$/.test(code)) {
      fetch(`${API_BASE_URL}/api/units/owner/${MASTER_DB_OWNER}`)
        .then(res => {
          if (!res.ok) throw new Error("Server connection failed");
          return res.json();
        })
        .then(allUnits => {
          const tenantUnit = allUnits.find(u => u.tenantPhone === code && String(u.password) === String(pass));
          if (tenantUnit) {
            setActiveHouse({ id: tenantUnit.houseId, name: tenantUnit.houseName });
            setActiveTenantData(tenantUnit);
            setIsTenant(true);
            setCurrentView('details');
          } else {
            alert("ACCESS DENIED: Invalid Resident Credentials.");
          }
        })
        .catch(err => alert("System Offline: Could not verify credentials."));
    } else {
      const foundHouse = houses.find(h => h.id === code.toLowerCase() && h.password === pass);
      if (foundHouse) {
        setActiveHouse(foundHouse);
        setIsTenant(false);
        setCurrentView('details');
      } else {
        alert("ACCESS DENIED: Invalid Property ID or Security PIN.");
      }
    }
  };

  const handleAddNewHouse = async () => {
    const formattedId = newHouse.id.toLowerCase().replace(/\s+/g, '-');
    if (!formattedId || !newHouse.name) return alert("Required fields missing.");
    const pass = newHouse.password?.trim() || Math.random().toString(36).slice(-6).toUpperCase();
    const payload = { id: formattedId, name: newHouse.name, password: pass, ownerEmail: MASTER_DB_OWNER };
    try {
      const res = await fetch(`${API_BASE_URL}/api/houses`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (res.ok) { fetchHouses(); setIsAddingHouse(false); setNewHouse({ id: '', name: '', password: '' }); }
    } catch (err) { alert("Error saving house."); }
  };

  const handleDeleteHouse = async (e, houseId) => {
    e.stopPropagation();
    if (!window.confirm("Delete property permanently from database?")) return;
    await fetch(`${API_BASE_URL}/api/houses/${houseId}`, { method: 'DELETE' });
    await fetch(`${API_BASE_URL}/api/units/house/${houseId}`, { method: 'DELETE' });
    fetchHouses();
  };

  const handleAddUnit = async () => {
    if (!newRoom.unitNumber || newRoom.monthlyRent === '') {
      return alert("CRITICAL: Unit ID and Monthly Lease Value are required.");
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...newRoom, 
            ownerEmail: MASTER_DB_OWNER, 
            houseId: activeHouse.id, 
            houseName: activeHouse.name, 
            isOccupied: !!newRoom.tenantName,
            monthlyRent: parseInt(newRoom.monthlyRent) || 0
        })
      });
      if (res.ok) { 
        setIsAdding(false); 
        fetchUnits(activeHouse.id); 
        setNewRoom({ unitNumber: '', floor: '', monthlyRent: '', tenantPhone: '', tenantName: '', password: '' }); 
      } else {
        const errorMsg = await res.text();
        alert(`SYNC ERROR: ${res.status} - ${errorMsg}`);
      }
    } catch (err) { alert("CONNECTION FAILURE"); } finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    const payload = { ...editData, isOccupied: !!editData.tenantName, monthlyRent: parseInt(editData.monthlyRent) || 0 };
    await fetch(`${API_BASE_URL}/api/units/${payload.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    setSelectedRoom(null); setEditData(null); fetchUnits(activeHouse.id);
  };

  const handleDeleteUnit = async (id) => {
    if (!window.confirm("Delete unit?")) return;
    await fetch(`${API_BASE_URL}/api/units/${id}`, { method: 'DELETE' });
    setSelectedRoom(null); fetchUnits(activeHouse.id);
  };

  const handleRaiseTicket = async () => {
    if (!issueData.description) return alert("Please describe the issue.");
    const ticket = {
      unitNumber: isTenant ? activeTenantData.unitNumber : selectedRoom.unitNumber,
      houseId: activeHouse.id,
      category: issueData.category,
      description: issueData.description,
      status: "OPEN"
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ticket)
      });
      if (res.ok) {
        alert("Ticket Created: Maintenance has been notified.");
        setIssueData({ category: 'Electrician', description: '' });
        if (!isTenant) setSelectedRoom(null);
      }
    } catch (err) { alert("Failed to connect to maintenance server."); }
  };

  const handleResolveTicket = async (id) => {
    await fetch(`${API_BASE_URL}/api/tickets/${id}`, { method: 'DELETE' });
    fetchUnits(activeHouse.id);
  };

  const handleSendSMS = async (roomId) => {
    if (!window.confirm("Send reminder SMS?")) return;
    await fetch(`${API_BASE_URL}/api/units/${roomId}/sms`, { method: 'POST' });
    alert("✅ Sent");
  };

  const handleAppLogout = async () => {
    try {
      await logout(); 
      setUser(null); setIsAdmin(false); setIsTenant(false); setActiveTenantData(null);
      setHouses([]); setRooms([]); setActiveHouse(null); setSelectedRoom(null);
      setClientAccessCode(''); setClientPassword('');
      setCurrentView('landing');
    } catch (err) { setCurrentView('landing'); }
  };

  const totalRevenue = rooms.reduce((acc, r) => acc + (r.isOccupied ? (parseInt(r.monthlyRent) || 0) : 0), 0);

  // ==========================================
  // UPDATED RENDER LOGIC WITH ENHANCED LANDING
  // ==========================================
  if (currentView === 'landing' && !loading) return (
    <div className="bg-[#050505] min-h-screen text-white overflow-x-hidden">
      
      {/* 1. HERO SECTION (Tweak to highlight multi-role system) */}
      <section className="relative h-[90vh] flex flex-col items-center justify-center border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=2000" className="w-full h-full object-cover opacity-40 scale-105" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#050505]"></div>
        </div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="z-10 text-center mt-10 px-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#FFBF00]/30 bg-[#FFBF00]/10 text-[#FFBF00] text-[10px] font-black tracking-widest uppercase mb-8 backdrop-blur-md">
            <Fingerprint size={12} /> Elite Real Estate SaaS
          </div>
          <h1 className="text-7xl md:text-[8rem] font-black italic tracking-tighter uppercase mb-6 leading-none drop-shadow-2xl">
              NoMad<span className="text-[#FFBF00]">Nest</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-base md:text-lg leading-relaxed mb-10 font-medium italic">
              Precision data architecture bridging Global Admins, Property Partners, and Residents in one unified matrix.
          </p>
          <button onClick={() => loginWithGoogle()} className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#FFBF00] transition-all flex items-center gap-3 mx-auto shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-105">
            Secure Platform Login <ChevronRight size={16} />
          </button>
        </motion.div>
      </section>
      
      {/* 2. EXISTING STATS & IMAGES */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase mb-8 leading-tight tracking-tighter">
              Portfolio <span className="text-[#FFBF00]">Intelligence</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-10 font-medium">
              Manage high-yield assets with technical superiority. NoMadNest provides a unified console for multi-tier access, automated resident communication, and live maintenance tracking. Built for scale.
            </p>
            <div className="grid grid-cols-3 gap-6 border-t border-white/5 pt-8">
              <div><h4 className="text-[#FFBF00] text-3xl font-black italic mb-1">99.9%</h4><p className="text-gray-600 text-[9px] font-black uppercase tracking-widest">Uptime</p></div>
              <div><h4 className="text-[#FFBF00] text-3xl font-black italic mb-1">200ms</h4><p className="text-gray-600 text-[9px] font-black uppercase tracking-widest">Sync Speed</p></div>
              <div><h4 className="text-[#FFBF00] text-3xl font-black italic mb-1">AES</h4><p className="text-gray-600 text-[9px] font-black uppercase tracking-widest">Encryption</p></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 h-[500px]">
            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl mt-12 bg-[#111] border border-white/5 relative">
              <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700 absolute inset-0" alt="" />
            </div>
            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl mb-12 bg-[#111] border border-white/5 relative">
              <img src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700 absolute inset-0" alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. NEW ADDITION: ARCHITECTURE & CAPABILITIES DETAILS */}
      <section className="py-12 px-6 max-w-7xl mx-auto border-t border-white/5 mb-24">
         <div className="text-center mb-16">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">System <span className="text-[#FFBF00]">Capabilities</span></h3>
            <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mt-4">Enterprise-Grade Infrastructure</p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Capability 1 */}
            <div className="bg-[#0c0c0c] border border-white/5 p-10 rounded-[2.5rem] hover:border-[#FFBF00]/30 transition-all group shadow-xl">
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[#FFBF00] mb-8 group-hover:scale-110 transition-transform"><ShieldCheck size={28}/></div>
               <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4">Multi-Tier Authorization</h4>
               <p className="text-gray-400 text-sm leading-relaxed font-medium">Strict access control gateways. Global Admins manage the matrix, Property Partners oversee designated assets, and Residents access dedicated service consoles via secure PINs.</p>
            </div>
            {/* Capability 2 */}
            <div className="bg-[#0c0c0c] border border-white/5 p-10 rounded-[2.5rem] hover:border-orange-500/30 transition-all group shadow-xl">
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-orange-500 mb-8 group-hover:scale-110 transition-transform"><AlertCircle size={28}/></div>
               <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4">Live Service Pipeline</h4>
               <p className="text-gray-400 text-sm leading-relaxed font-medium">Real-time maintenance ticketing system. Residents deploy fault reports instantly, triggering priority notifications for property managers to track, resolve, and archive.</p>
            </div>
            {/* Capability 3 */}
            <div className="bg-[#0c0c0c] border border-white/5 p-10 rounded-[2.5rem] hover:border-green-500/30 transition-all group shadow-xl">
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-green-500 mb-8 group-hover:scale-110 transition-transform"><Target size={28}/></div>
               <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4">Yield & Asset Tracking</h4>
               <p className="text-gray-400 text-sm leading-relaxed font-medium">Automated financial projections and occupancy mapping. Track vacant vs. secure units, calculate monthly gross portfolio yields, and dispatch automated SMS payment reminders.</p>
            </div>
         </div>
      </section>

    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10 relative">
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
      
      {loading && houses.length === 0 ? (
          <div className="fixed inset-0 bg-black/90 z-[1000] flex flex-col items-center justify-center text-center">
             <RefreshCw size={48} className="text-[#FFBF00] animate-spin mb-6" />
             <h2 className="text-xl font-black italic uppercase text-white tracking-widest">Initializing Cloud Matrix</h2>
             <p className="text-gray-600 text-[10px] uppercase font-black tracking-[0.4em] mt-2">Waking up secure data servers...</p>
          </div>
      ) : currentView === 'client_gateway' ? (
        <ClientGateway 
          clientAccessCode={clientAccessCode}
          setClientAccessCode={setClientAccessCode}
          clientPassword={clientPassword}
          setClientPassword={setClientPassword}
          handleClientAccess={handleClientAccess}
          handleAppLogout={handleAppLogout}
          user={user}
        />
      ) : (
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
            <div className="flex items-center gap-4 cursor-pointer" 
                 onClick={() => {
                   if (user && AUTHORIZED_ADMINS.includes(user.email)) {
                     setCurrentView('portfolio');
                     setActiveHouse(null);
                   } else {
                     setCurrentView('client_gateway');
                   }
                 }}>
              <div className="bg-[#FFBF00] p-3 rounded-xl text-black shadow-lg shadow-[#FFBF00]/10"><Building2 size={24} /></div>
              <div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter">NoMadNest</h1>
                <p className="text-[8px] text-gray-500 font-black tracking-[0.3em] uppercase">{activeHouse?.name || 'Asset Management'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 relative">
               {!isTenant && (
                 <div className="relative">
                    <button onClick={() => setShowNotifications(!showNotifications)} className={`p-4 rounded-xl border transition-all ${tickets.length > 0 ? 'bg-orange-500/10 border-orange-500/30 text-orange-500 animate-pulse' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                        <Bell size={22} />
                        {tickets.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black">{tickets.length}</span>}
                    </button>
                    {showNotifications && <NotificationPanel tickets={tickets} handleResolveTicket={handleResolveTicket} />}
                 </div>
               )}
               <div className="hidden md:block text-right mr-2">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{user?.email}</p>
                  <p className="text-[8px] font-black text-[#FFBF00] uppercase italic">{isSuperAdmin ? 'Global Admin' : isTenant ? 'Resident' : 'Property Partner'}</p>
               </div>
               <button onClick={handleAppLogout} className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><LogOut size={22} /></button>
            </div>
        </div>

        {isTenant ? (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
              <div className="bg-[#0c0c0c] border border-[#FFBF00]/20 p-12 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFBF00]/5 blur-[100px]"></div>
                 <div className="w-24 h-24 bg-[#FFBF00]/10 rounded-full flex items-center justify-center mx-auto mb-8 text-[#FFBF00] shadow-2xl border border-[#FFBF00]/20"><Zap size={48}/></div>
                 <h2 className="text-5xl font-black italic uppercase mb-2 tracking-tighter">Service Console</h2>
                 <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest mb-12 flex items-center justify-center gap-2"><MapPin size={12}/> Unit {activeTenantData?.unitNumber} • {activeHouse?.name}</p>
                 <div className="space-y-8 text-left border-t border-white/5 pt-10">
                    <div>
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-3 mb-3 block">Service Category</label>
                        <select value={issueData.category} onChange={e=>setIssueData({...issueData, category: e.target.value})} className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none text-white focus:border-[#FFBF00]/50 font-bold transition-all">
                            {ISSUE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-600 uppercase ml-3 mb-3 block">Problem Description</label>
                        <textarea value={issueData.description} onChange={e=>setIssueData({...issueData, description: e.target.value})} placeholder="Describe the fault in detail..." className="w-full bg-black border border-white/10 p-6 rounded-2xl outline-none text-white h-44 focus:border-[#FFBF00]/50 font-medium leading-relaxed" />
                    </div>
                    <button onClick={handleRaiseTicket} className="w-full bg-[#FFBF00] text-black font-black py-7 rounded-2xl uppercase tracking-widest text-[13px] hover:scale-[1.02] transition-all shadow-2xl shadow-[#FFBF00]/20">Request Maintenance</button>
                 </div>
              </div>
           </motion.div>
        ) : (
           currentView === 'portfolio' ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-2 relative overflow-hidden bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 p-12 flex flex-col justify-center shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=800" className="absolute inset-0 w-full h-full object-cover opacity-[0.15]" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                  <div className="relative z-10">
                    <p className="text-[#FFBF00] text-[10px] uppercase font-black tracking-[0.4em] mb-2 flex items-center gap-2"><TrendingUp size={14}/> Active Portfolio Yield</p>
                    <div className="flex items-end gap-4 mt-4">
                        <p className="text-8xl font-black italic text-white leading-none tracking-tighter">{houses.length.toString().padStart(2, '0')}</p>
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest pb-2">Properties Secured</p>
                    </div>
                  </div>
                </div>
                {houses.map(h => (
                   <motion.div whileHover={{ y: -5 }} key={h.id} onClick={()=>{setActiveHouse(h); setCurrentView('details');}} className="aspect-square bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-center items-center cursor-pointer hover:border-[#FFBF00]/30 transition-all relative group shadow-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#FFBF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 group-hover:bg-[#FFBF00] transition-all duration-500 relative z-10"><Store size={40} className="group-hover:text-black transition-colors"/></div>
                      <h3 className="text-2xl font-black italic uppercase text-center leading-tight relative z-10">{h.name}</h3>
                      <p className="text-[10px] text-gray-600 mt-3 font-black tracking-[0.3em] uppercase bg-black/50 px-4 py-1.5 rounded-full border border-white/5 relative z-10">{h.id}</p>
                      <button onClick={(e)=>{e.stopPropagation(); handleDeleteHouse(e, h.id);}} className="absolute top-6 right-6 p-3 text-red-500/20 hover:text-red-500 transition-colors z-20"><Trash2 size={16}/></button>
                   </motion.div>
                ))}
                <div onClick={()=>setIsAddingHouse(true)} className="aspect-square border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-700 hover:text-[#FFBF00] hover:border-[#FFBF00]/30 cursor-pointer transition-all bg-white/[0.01]">
                    <Plus size={48} className="mb-4"/>
                    <p className="text-[10px] font-black uppercase tracking-widest italic">Deploy Cloud Asset</p>
                </div>
              </div>
           ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-[#0c0c0c] p-12 rounded-[3rem] border border-white/5 shadow-2xl group overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><BarChart3 size={14}/> Monthly Gross Portfolio Yield</p>
                        <p className="text-8xl font-black italic text-green-500 mt-4 leading-none tracking-tighter">₹{totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#0c0c0c] p-12 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><LayoutDashboard size={14}/> Managed Unit Architecture</p>
                        <p className="text-8xl font-black italic text-white mt-4 leading-none tracking-tighter">{rooms.length.toString().padStart(2, '0')}</p>
                    </div>
                </div>
                <div className="flex justify-between items-center mb-8">
                   <div className="flex gap-4">
                      <button onClick={()=>setIsAdmin(!isAdmin)} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all shadow-lg ${isAdmin ? 'bg-[#FFBF00] text-black border-transparent' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>Edit Protocol: {isAdmin ? 'ACTIVE' : 'LOCKED'}</button>
                      {isAdmin && <button onClick={()=>setIsAdding(true)} className="px-8 py-4 bg-[#FFBF00] text-black font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-[#FFBF00]/20 flex items-center gap-2 animate-in fade-in slide-in-from-left-4"><Plus size={18} strokeWidth={3}/> Register System Unit</button>}
                   </div>
                   <button onClick={()=>fetchUnits(activeHouse.id)} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:text-[#FFBF00] hover:rotate-180 transition-all duration-700"><RefreshCw size={22} /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {rooms.map(r => (
                        <div key={r.id} className="p-10 bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] hover:border-[#FFBF00]/20 transition-all group relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFBF00]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="flex justify-between items-start mb-8">
                                <span className="text-4xl font-black italic tracking-tighter">{r.unitNumber}</span>
                                <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border uppercase tracking-widest shadow-inner ${r.isOccupied ? 'border-red-500/20 text-red-500 bg-red-500/5' : 'border-green-500/20 text-green-500 bg-green-500/5'}`}>{r.isOccupied ? 'SECURE' : 'VACANT'}</span>
                            </div>
                            <p className="text-4xl font-thin italic mb-10 text-white/90">₹{r.monthlyRent?.toLocaleString()}</p>
                            <button onClick={()=>setSelectedRoom(r)} className="w-full py-5 bg-white/5 border border-white/10 text-[10px] font-black uppercase rounded-2xl hover:bg-[#FFBF00] hover:text-black transition-all shadow-lg tracking-[0.2em]">Manage Asset</button>
                        </div>
                    ))}
                </div>
              </div>
           )
        )}
      </div>
      )}

      {/* --- ALL MODALS --- */}
      <AnimatePresence>
        {selectedRoom && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#0c0c0c] border border-white/10 p-12 rounded-[3rem] w-full max-w-lg relative shadow-2xl">
                    <button onClick={()=>{setSelectedRoom(null); setEditData(null);}} className="absolute top-10 right-10 text-gray-500 hover:text-white p-2 border border-white/10 rounded-full transition-all"><X size={24}/></button>
                    <div className="flex items-center gap-6 mb-10 border-b border-white/5 pb-8">
                        <div className="p-5 bg-[#FFBF00]/10 rounded-3xl text-[#FFBF00] border border-[#FFBF00]/20"><FileText size={40} /></div>
                        <div>
                          <h2 className="text-4xl font-black italic uppercase text-[#FFBF00] tracking-tighter leading-none">Unit {selectedRoom.unitNumber}</h2>
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-2">{selectedRoom.isOccupied ? `Tenant: ${selectedRoom.tenantName}` : 'Status: Asset Vacant'}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {editData && isAdmin ? (
                          <div className="space-y-6 animate-in slide-in-from-bottom-4">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black text-gray-600 uppercase ml-2">Monthly Lease (₹)</label>
                                  <input className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#FFBF00]/50 font-bold" value={editData.monthlyRent} onChange={e=>setEditData({...editData, monthlyRent: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-black text-gray-600 uppercase ml-2">Access PIN</label>
                                  <input className="w-full bg-black border border-white/10 p-5 rounded-2xl text-[#FFBF00] outline-none focus:border-[#FFBF00]/50 font-bold" value={editData.password} onChange={e=>setEditData({...editData, password: e.target.value})} />
                                </div>
                             </div>
                             <input className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#FFBF00]/50" placeholder="Tenant Name" value={editData.tenantName} onChange={e=>setEditData({...editData, tenantName: e.target.value})} />
                             <input className="w-full bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#FFBF00]/50" placeholder="Mobile" value={editData.tenantPhone} onChange={e=>setEditData({...editData, tenantPhone: e.target.value})} />
                             <div className="flex gap-4 pt-4">
                                <button onClick={handleUpdate} className="flex-1 py-5 bg-[#FFBF00] text-black font-black uppercase text-[11px] rounded-2xl shadow-xl shadow-[#FFBF00]/10 hover:scale-105 transition-all">Apply Data Protocol</button>
                                <button onClick={()=>handleDeleteUnit(selectedRoom.id)} className="p-5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                             </div>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-4">
                               <div className="flex justify-between items-center border-b border-white/5 pb-4"><span className="text-gray-600 text-[10px] font-black uppercase">Lease Value</span><span className="text-2xl font-thin italic tracking-tight">₹{selectedRoom.monthlyRent?.toLocaleString()}</span></div>
                               <div className="flex justify-between items-center border-b border-white/5 pb-4"><span className="text-gray-600 text-[10px] font-black uppercase">Occupant</span><span className="font-bold italic text-lg uppercase tracking-tighter">{selectedRoom.tenantName || 'N/A'}</span></div>
                               <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                  <span className="text-gray-600 text-[10px] font-black uppercase">Communication</span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-400 font-bold italic">{selectedRoom.tenantPhone || 'NO-LINK'}</span>
                                    {selectedRoom.tenantPhone && <a href={`https://wa.me/${selectedRoom.tenantPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-black transition-all shadow-lg"><MessageCircle size={16} /></a>}
                                    {isAdmin && selectedRoom.tenantPhone && <button onClick={() => handleSendSMS(selectedRoom.id)} className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg"><Activity size={16}/></button>}
                                  </div>
                               </div>
                            </div>
                            <div className="bg-orange-500/5 border border-orange-500/10 p-8 rounded-[2.5rem] mt-10 text-center relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform duration-500"><Zap size={100}/></div>
                                <p className="text-[11px] font-black text-orange-500 uppercase mb-5 flex items-center justify-center gap-2 tracking-[0.2em] relative z-10"><AlertCircle size={14}/> Maintenance Override</p>
                                <select value={issueData.category} onChange={e=>setIssueData({...issueData, category: e.target.value})} className="w-full bg-black border border-white/10 p-5 rounded-2xl text-xs text-white mb-5 outline-none font-bold relative z-10">
                                    {ISSUE_CATEGORIES.map(c=><option key={c}>{c}</option>)}
                                </select>
                                <button onClick={handleRaiseTicket} className="w-full bg-orange-500 text-black font-black py-5 rounded-2xl text-[11px] uppercase shadow-lg shadow-orange-500/10 relative z-10 active:scale-95 transition-all">Submit Fix Request</button>
                            </div>
                            {isAdmin && <button onClick={()=>setEditData(selectedRoom)} className="w-full py-5 text-[10px] font-black text-gray-700 uppercase hover:text-[#FFBF00] border border-white/5 rounded-2xl mt-6 transition-all hover:bg-white/[0.02]">Modify Asset Credentials</button>}
                          </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}

        {isAdding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#0c0c0c] border border-white/10 p-12 rounded-[3rem] w-full max-w-lg relative shadow-2xl">
                <button onClick={()=>setIsAdding(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white transition-all"><X size={24}/></button>
                <h2 className="text-4xl font-black italic uppercase text-[#FFBF00] mb-10 tracking-tighter">Initialize System Unit</h2>
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <input className="bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#FFBF00]/30 font-bold" placeholder="Unit ID" value={newRoom.unitNumber} onChange={e=>setNewRoom({...newRoom, unitNumber: e.target.value})} />
                        <input className="bg-black border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-[#FFBF00]/30 font-bold" placeholder="Level" value={newRoom.floor} onChange={e=>setNewRoom({...newRoom, floor: e.target.value})} />
                    </div>
                    <input className="bg-black border border-white/10 w-full p-5 rounded-2xl text-white outline-none focus:border-[#FFBF00]/30" placeholder="Tenant Full Name" value={newRoom.tenantName} onChange={e=>setNewRoom({...newRoom, tenantName: e.target.value})} />
                    <input className="bg-black border border-white/10 w-full p-5 rounded-2xl text-white outline-none focus:border-[#FFBF00]/30" placeholder="Mobile Primary Connection" value={newRoom.tenantPhone} onChange={e=>setNewRoom({...newRoom, tenantPhone: e.target.value})} />
                    <input className="bg-black border border-[#FFBF00]/20 w-full p-5 rounded-2xl text-[#FFBF00] font-black outline-none text-center" placeholder="SECURE RESIDENT PIN" value={newRoom.password} onChange={e=>setNewRoom({...newRoom, password: e.target.value})} />
                    <div className="pt-4 text-center">
                        <label className="text-[10px] font-black text-gray-600 uppercase mb-3 block tracking-[0.3em]">Monthly Lease Value (INR)</label>
                        <input className="bg-black border border-white/5 w-full p-8 rounded-[2rem] text-5xl font-black text-[#FFBF00] text-center shadow-inner" type="number" value={newRoom.monthlyRent} onChange={e=>setNewRoom({...newRoom, monthlyRent: e.target.value === '' ? '' : parseInt(e.target.value)})} />
                    </div>
                    <button onClick={handleAddUnit} className="w-full bg-[#FFBF00] text-black font-black py-7 rounded-2xl uppercase tracking-widest mt-6 shadow-2xl active:scale-95 transition-all">Commit Asset</button>
                </div>
            </motion.div>
          </motion.div>
        )}

        {isAddingHouse && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#0c0c0c] border border-green-500/20 p-12 rounded-[3rem] w-full max-w-lg relative shadow-2xl">
                <button onClick={()=>setIsAddingHouse(false)} className="absolute top-10 right-10 text-gray-500 hover:text-white transition-all"><X size={24}/></button>
                <h2 className="text-4xl font-black italic uppercase text-green-500 mb-10 text-center tracking-tighter leading-none">Deploy Global Asset Architecture</h2>
                <div className="space-y-6">
                    <div>
                      <label className="text-[9px] font-black text-gray-700 uppercase ml-2 mb-2 block">System ID</label>
                      <input className="bg-black border border-white/10 w-full p-5 rounded-2xl text-white outline-none text-center font-bold focus:border-green-500/30" placeholder="e.g. hitech-city-01" value={newHouse.id} onChange={e=>setNewHouse({...newHouse, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-gray-700 uppercase ml-2 mb-2 block">Branding Identity</label>
                      <input className="bg-black border border-white/10 w-full p-5 rounded-2xl text-white outline-none text-center text-2xl font-black italic focus:border-green-500/30" placeholder="GODAVARI LUXE" value={newHouse.name} onChange={e=>setNewHouse({...newHouse, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-gray-700 uppercase ml-2 mb-2 block">Admin Authorization PIN</label>
                      <input className="bg-black border border-white/10 w-full p-5 rounded-2xl text-[#FFBF00] outline-none text-center font-black tracking-widest focus:border-green-500/30 shadow-inner" placeholder="REQUIRED" value={newHouse.password} onChange={e=>setNewHouse({...newHouse, password: e.target.value})} />
                    </div>
                    <button onClick={handleAddNewHouse} className="w-full bg-green-500 text-black font-black py-7 rounded-2xl uppercase tracking-widest mt-6 shadow-2xl shadow-green-500/10 hover:scale-[1.02] transition-all">Initialize Cloud Matrix</button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;