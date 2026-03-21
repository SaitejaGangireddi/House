import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Database, RefreshCw, Home, Store, X, FileText, MessageCircle, Settings, Save, Plus, Trash2, Building2, LogOut, ChevronDown, ArrowLeft, Globe, ChevronRight, LayoutDashboard, Target, Zap, Fingerprint, Lock, Key, BarChart3, TrendingUp, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App = () => {
  // --- CORE APP STATE ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('landing'); 
  const [isAdmin, setIsAdmin] = useState(false); 
  
  // --- SECURITY LOGIC ---
  const AUTHORIZED_ADMINS = [
    "saitejagangireddi@gmail.com",
    "anushagundumalla@gmail.com", // Add more admin emails here
     "saitejagangireddiphotos@gmail.com" // Add more admin emails here
  ];
  const isSuperAdmin = user && AUTHORIZED_ADMINS.includes(user.email);
  const MASTER_DB_OWNER = "saitejagangireddi@gmail.com";

  // --- DATA STATES ---
  const [houses, setHouses] = useState([]); // Now starts empty and loads from DB
  const [activeHouse, setActiveHouse] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isAddingHouse, setIsAddingHouse] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editData, setEditData] = useState(null);
  
  // --- FORM STATES ---
  const [newHouse, setNewHouse] = useState({ id: '', name: '', password: '' });
  const [newRoom, setNewRoom] = useState({ unitNumber: '', floor: '', monthlyRent: 0, tenantPhone: '', tenantName: '' });
  
  // --- CLIENT AUTH STATES ---
  const [clientAccessCode, setClientAccessCode] = useState('');
  const [clientPassword, setClientPassword] = useState('');

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://sturdy-spoon-4pwqxj59r593qqg9-8080.app.github.dev";

  // --- AUTH LISTENER & ROUTING ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser && currentView === 'landing') {
        if (AUTHORIZED_ADMINS.includes(currentUser.email)) {
          setCurrentView('portfolio'); 
        } else {
          setCurrentView('client_gateway'); 
        }
      }
    });
    return () => unsubscribe();
  }, [currentView]);

  // --- CLOUD SYNC: FETCH HOUSES FROM AIVEN ---
  useEffect(() => {
    if (user) {
      fetchHouses();
    }
  }, [user]);

  const fetchHouses = () => {
    fetch(`${API_BASE_URL}/api/houses/owner/${MASTER_DB_OWNER}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setHouses(data))
      .catch(err => console.error("Error fetching houses:", err));
  };

  // --- CLOUD SYNC: FETCH ROOMS FROM AIVEN ---
  useEffect(() => {
    if (user && activeHouse) {
      setRooms([]); 
      fetchUnits(activeHouse.id);
    }
  }, [user, activeHouse?.id]);

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
        setRooms([]); 
        setLoading(false); 
      });
  };

  // --- BUSINESS HANDLERS (DATABASE DRIVEN) ---
  
  const handleAddNewHouse = async () => {
    const formattedId = newHouse.id.toLowerCase().replace(/\s+/g, '-');
    if (!formattedId || !newHouse.name) return alert("Required fields missing.");
    
    const finalPassword = newHouse.password?.trim() || Math.random().toString(36).slice(-6).toUpperCase();

    const housePayload = {
        id: formattedId,
        name: newHouse.name,
        password: finalPassword,
        ownerEmail: MASTER_DB_OWNER
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/houses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(housePayload)
      });
      if (res.ok) {
        fetchHouses(); // Refresh list from DB
        setIsAddingHouse(false);
        setNewHouse({ id: '', name: '', password: '' });
      }
    } catch (err) { alert("Error saving to database."); }
  };

  const handleGeneratePassword = async (e, houseId) => {
    e.stopPropagation(); 
    const houseToUpdate = houses.find(h => h.id === houseId);
    if (!houseToUpdate) return;

    const updatedHouse = { ...houseToUpdate, password: Math.random().toString(36).slice(-6).toUpperCase() };
    
    await fetch(`${API_BASE_URL}/api/houses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedHouse)
    });
    fetchHouses();
  };

  const handleDeleteHouse = async (e, houseId) => {
    e.stopPropagation();
    if (!window.confirm("Delete property permanently from database?")) return;
    await fetch(`${API_BASE_URL}/api/houses/${houseId}`, { method: 'DELETE' });
    // Also delete associated units
    await fetch(`${API_BASE_URL}/api/units/house/${houseId}`, { method: 'DELETE' });
    fetchHouses();
  };

  const handleAddUnit = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...newRoom, 
            ownerEmail: MASTER_DB_OWNER, 
            houseId: activeHouse.id, 
            houseName: activeHouse.name, 
            isOccupied: !!newRoom.tenantName 
        })
      });
      if (res.ok) {
        setIsAdding(false);
        fetchUnits(activeHouse.id);
        setNewRoom({ unitNumber: '', floor: '', monthlyRent: 0, tenantPhone: '', tenantName: '' });
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdate = async () => {
    const hasTenant = editData.tenantName?.trim() !== "";
    const payload = { ...editData, isOccupied: hasTenant, monthlyRent: parseInt(editData.monthlyRent) || 0 };
    await fetch(`${API_BASE_URL}/api/units/${payload.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setSelectedRoom(null);
    setEditData(null);
    fetchUnits(activeHouse.id);
  };

  const handleDeleteUnit = async (id) => {
    if (!window.confirm("Delete unit?")) return;
    await fetch(`${API_BASE_URL}/api/units/${id}`, { method: 'DELETE' });
    setSelectedRoom(null);
    fetchUnits(activeHouse.id);
  };

  const handleSendSMS = async (roomId) => {
    if (!window.confirm("Send SMS?")) return;
    await fetch(`${API_BASE_URL}/api/units/${roomId}/sms`, { method: 'POST' });
    alert("✅ Sent");
  };

  const handleClientAccess = () => {
    const formattedId = clientAccessCode.toLowerCase().trim();
    const foundHouse = houses.find(h => h.id === formattedId);
    if (!foundHouse) return alert("ACCESS DENIED: Invalid Property ID.");
    if (foundHouse.password !== clientPassword.trim()) return alert("ACCESS DENIED: Incorrect Password.");
    setActiveHouse(foundHouse);
    setCurrentView('details');
  };

  const handleAppLogout = () => {
    logout();
    setCurrentView('landing');
    setActiveHouse(null);
    setClientAccessCode('');
    setClientPassword('');
  };

  const totalRevenue = rooms.reduce((acc, r) => acc + (r.isOccupied ? (parseInt(r.monthlyRent) || 0) : 0), 0);

  // --- RENDERING VIEWS (NO CHANGES TO UI OR ANIMATIONS) ---

  const LandingPage = () => (
    <div className="bg-[#050505] min-h-screen text-white">
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
              High-performance asset management for elite residential portfolios. Precision data architecture for modern property owners.
          </p>
          <button onClick={() => loginWithGoogle()} className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-[#FFBF00] transition-all flex items-center gap-3 mx-auto shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-105">
            Secure Platform Login <ChevronRight size={16} />
          </button>
        </motion.div>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase mb-8 leading-tight tracking-tighter">
              Portfolio <span className="text-[#FFBF00]">Intelligence</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed mb-10">
              Manage high-yield assets with technical superiority. NoMadNest provides a unified console for tenant tracking, automated communication, and financial projections. Built for scale, engineered for speed.
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
    </div>
  );

  const ClientGateway = () => (
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
          <div className="mx-auto w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 text-[#FFBF00] shadow-lg">
              <Lock size={32} />
          </div>
          <h2 className="text-3xl font-black italic uppercase text-white mb-2 tracking-tighter">Client Gateway</h2>
          <p className="text-gray-500 text-[9px] uppercase tracking-[0.2em] font-black mb-10 flex items-center justify-center gap-2">
            <ShieldCheck size={12}/> Authenticated: {user?.email}
          </p>
          
          <div className="space-y-4">
              <div className="relative">
                  <Key size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                      type="text" 
                      value={clientAccessCode}
                      onChange={(e) => setClientAccessCode(e.target.value)}
                      placeholder="Enter Property ID"
                      className="w-full bg-black border-2 border-white/5 rounded-[2rem] py-5 pl-16 pr-6 text-white text-sm font-bold tracking-widest outline-none focus:border-[#FFBF00]/50 transition-colors shadow-inner"
                  />
              </div>
              <div className="relative">
                  <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                      type="password" 
                      value={clientPassword}
                      onChange={(e) => setClientPassword(e.target.value)}
                      placeholder="Enter Access Password"
                      className="w-full bg-black border-2 border-white/5 rounded-[2rem] py-5 pl-16 pr-6 text-white text-sm font-bold tracking-widest outline-none focus:border-[#FFBF00]/50 transition-colors shadow-inner"
                  />
              </div>
              <button onClick={handleClientAccess} className="w-full bg-[#FFBF00] text-black font-black py-5 rounded-[2rem] uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] transition-all shadow-[0_10px_40px_rgba(255,191,0,0.2)] mt-2">
                  Connect to Asset
              </button>
          </div>
          <button onClick={handleAppLogout} className="mt-10 text-gray-600 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto">
            <LogOut size={14}/> Secure Disconnect
          </button>
        </motion.div>
      </div>
    </div>
  );

  if (currentView === 'landing' && !loading) return <LandingPage />;
  if (currentView === 'client_gateway' && !loading) return <ClientGateway />;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-10">
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] bg-[length:100%_2px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]"></div>

      {currentView === 'portfolio' && isSuperAdmin ? (
        <div className="relative z-10 animate-in fade-in duration-500">
          <header className="flex flex-col md:flex-row justify-between items-center mb-16 border-b border-white/5 pb-8 gap-6">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView('landing')}>
              <div className="bg-[#FFBF00] p-4 rounded-2xl text-black"><Building2 size={28} /></div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">NoMadNest</h1>
            </div>
            <div className="flex items-center gap-5">
              <div className="hidden lg:block text-right">
                <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest mb-1">{user?.email}</p>
                <p className="text-[#FFBF00] text-[8px] font-black uppercase tracking-widest italic">Authorized Admin</p>
              </div>
              <button onClick={handleAppLogout} className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-5"><LogOut size={16} /> Disconnect</button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="col-span-1 md:col-span-2 relative overflow-hidden bg-[#0c0c0c] rounded-[2.5rem] border border-white/5 p-10 flex flex-col justify-center shadow-2xl">
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

            {houses.map(house => (
              <motion.div key={house.id} whileHover={{ y: -5 }} onClick={() => { setActiveHouse(house); setCurrentView('details'); }} className="aspect-square bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 flex flex-col justify-center items-center cursor-pointer hover:border-[#FFBF00]/40 transition-all relative group shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFBF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <button onClick={(e) => handleDeleteHouse(e, house.id)} className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-red-500/10 z-20"><Trash2 size={14} /></button>
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#FFBF00] transition-all duration-500 relative z-10"><Store size={32} className="group-hover:text-black transition-colors" /></div>
                <h2 className="text-xl font-black italic uppercase text-center leading-tight mb-2 relative z-10">{house.name}</h2>
                <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.3em] bg-black/50 px-4 py-1.5 rounded-full border border-white/5 relative z-10 flex items-center gap-1 mb-2"><MapPin size={10}/> {house.id}</p>
                
                {house.password ? (
                  <p className="text-[#FFBF00] text-[8px] font-black tracking-widest mt-1 flex items-center gap-1 border border-[#FFBF00]/20 bg-[#FFBF00]/10 px-2 py-1 rounded relative z-10"><Key size={10}/> {house.password}</p>
                ) : (
                  <button onClick={(e) => handleGeneratePassword(e, house.id)} className="text-red-400 text-[8px] font-black tracking-widest mt-1 flex items-center gap-1 border border-red-500/20 bg-red-500/10 px-2 py-1 rounded relative z-20 hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                    <Key size={10}/> SET PASS
                  </button>
                )}
              </motion.div>
            ))}

            <div onClick={() => setIsAddingHouse(true)} className="aspect-square border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FFBF00]/30 text-gray-600 hover:text-[#FFBF00] transition-all bg-white/[0.01] group">
              <Plus size={32} className="group-hover:scale-110 transition-transform"/>
              <p className="mt-4 font-black uppercase text-[9px] tracking-widest italic">Deploy Asset</p>
            </div>
          </div>
        </div>
      ) : (
        /* DASHBOARD (UNIT VIEW) - NO CHANGES */
        <div className="relative z-10 animate-in slide-in-from-right duration-500">
          <div className="flex justify-between items-center mb-12">
            <div className="flex gap-3">
              {isSuperAdmin ? (
                <>
                  <button onClick={() => { setCurrentView('portfolio'); setActiveHouse(null); }} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all"><ArrowLeft size={14} /> Global Assets</button>
                  <button onClick={() => { setCurrentView('landing'); setActiveHouse(null); }} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-[#FFBF00] transition-all"><Home size={14} /> Corporate</button>
                </>
              ) : (
                <button onClick={() => { setCurrentView('client_gateway'); setActiveHouse(null); }} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all"><ArrowLeft size={14} /> Change Property</button>
              )}
            </div>
            {!isSuperAdmin && (
                <button onClick={handleAppLogout} className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"><LogOut size={14} /> Sign Out</button>
            )}
          </div>
          
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 border-b border-white/10 pb-10 gap-6">
            <div>
              <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter uppercase text-[#FFBF00] mb-3">{activeHouse?.name}</h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2"><Globe size={14} /> {activeHouse?.id} • {isSuperAdmin ? 'Master View' : 'Property Admin'}</p>
            </div>
            <div className="flex gap-4 items-center">
              <button onClick={() => setIsAdmin(!isAdmin)} className={`px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest border transition-all shadow-lg ${isAdmin ? 'bg-[#FFBF00] text-black border-transparent' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}>
                {isAdmin ? 'EDIT MODE: ON' : 'EDIT MODE: OFF'}
              </button>
              <button onClick={() => fetchUnits(activeHouse.id)} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:text-[#FFBF00] hover:rotate-180 transition-all duration-700"><RefreshCw size={20} /></button>
              {isAdmin && <button onClick={() => setIsAdding(true)} className="px-8 py-4 bg-[#FFBF00] text-black font-black rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-[#FFBF00]/20"><Plus size={18} strokeWidth={3} /> Register Unit</button>}
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-[#0c0c0c] border border-white/5 p-10 rounded-[2.5rem] flex items-center justify-between group shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2"><Store size={14}/> Total Units</p>
                <p className="text-7xl font-thin italic text-white leading-none tracking-tighter">{rooms.length.toString().padStart(2, '0')}</p>
              </div>
            </div>
            <div className="bg-[#0c0c0c] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-700"></div>
              <div className="relative z-10">
                <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2"><BarChart3 size={14}/> Yield (Monthly)</p>
                <p className="text-7xl font-black italic uppercase text-green-500 leading-none tracking-tighter">₹{totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className={`p-8 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden ${room.isOccupied ? 'bg-[#0c0c0c] border-white/5 hover:border-white/10' : 'bg-[#FFBF00]/5 border-[#FFBF00]/10 hover:border-[#FFBF00]/30'}`}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFBF00]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-8 font-black italic text-2xl">
                  <span>{room.unitNumber}</span>
                  <span className={`text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-inner ${room.isOccupied ? 'text-red-500 border-red-500/20 bg-red-500/5' : 'text-green-500 border-green-500/20 bg-green-500/5'}`}>{room.isOccupied ? 'SECURE' : 'VACANT'}</span>
                </div>
                <div className="text-4xl font-light italic mb-8 text-white/90">₹{room.monthlyRent?.toLocaleString()}</div>
                <button onClick={() => { setEditData(null); setSelectedRoom(room); }} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FFBF00] hover:text-black transition-all">
                  {isAdmin ? 'Manage Unit' : 'View Data'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ALL MODALS (STRICTLY UNCHANGED UI) --- */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#0c0c0c] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-12 relative shadow-2xl">
              <button onClick={() => { setSelectedRoom(null); setEditData(null); }} className="absolute top-10 right-10 text-gray-600 hover:text-white transition-colors border border-white/10 p-2 rounded-full"><X size={24} /></button>
              <div className="flex items-center gap-5 mb-10">
                <div className="p-4 bg-[#FFBF00]/10 rounded-2xl text-[#FFBF00]"><FileText size={32} /></div>
                <div><h2 className="text-4xl font-black italic text-[#FFBF00] uppercase leading-none">Unit {selectedRoom.unitNumber}</h2><p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-1">Tenant: {selectedRoom.tenantName || 'None'}</p></div>
              </div>
              <div className="space-y-4 pt-8 border-t border-white/5">
                {editData && isAdmin ? (
                  <div className="space-y-6">
                    <div><label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-2 mb-2 block">Monthly Rent (₹)</label>
                    <input className="bg-black border border-white/10 w-full p-5 rounded-2xl text-2xl font-bold text-[#FFBF00] outline-none focus:border-[#FFBF00]/40 transition-all shadow-inner" type="number" value={editData.monthlyRent} onChange={e => setEditData({ ...editData, monthlyRent: parseInt(e.target.value) })} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <input className="bg-black border border-white/10 w-full p-5 rounded-2xl outline-none text-xs focus:border-white/20 transition-all shadow-inner" placeholder="Name" value={editData.tenantName || ''} onChange={e => setEditData({ ...editData, tenantName: e.target.value })} />
                      <input className="bg-black border border-white/10 w-full p-5 rounded-2xl outline-none text-xs focus:border-white/20 transition-all shadow-inner" placeholder="Phone" value={editData.tenantPhone || ''} onChange={e => setEditData({ ...editData, tenantPhone: e.target.value })} />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={handleUpdate} className="bg-[#FFBF00] text-black font-black flex-1 py-5 rounded-2xl uppercase tracking-widest text-[11px] shadow-xl shadow-[#FFBF00]/10 hover:scale-[1.02] transition-transform">Commit Update</button>
                      <button onClick={() => handleDeleteUnit(selectedRoom.id)} className="bg-red-500/10 text-red-500 px-6 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"><Trash2 size={20} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex justify-between items-end py-4 border-b border-white/5"><span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Lease Rate</span><span className="text-4xl font-thin italic">₹{selectedRoom.monthlyRent?.toLocaleString()}</span></div>
                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} /> Contact</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-[11px] font-black italic tracking-widest">{selectedRoom.tenantPhone || 'N/A'}</span>
                        {selectedRoom.tenantPhone && <a href={`https://wa.me/${selectedRoom.tenantPhone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-black transition-all border border-green-500/10 shadow-lg"><MessageCircle size={18} /></a>}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-white/5">
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-2"><Activity size={14} /> Last Dispatch</span>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-[11px] font-black">{selectedRoom.lastReminderSent ? new Date(selectedRoom.lastReminderSent).toLocaleDateString() : 'None'}</span>
                        {isAdmin && selectedRoom.tenantPhone && <button onClick={() => handleSendSMS(selectedRoom.id)} className="p-3 bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all border border-blue-500/10 shadow-lg"><Activity size={18} /></button>}
                      </div>
                    </div>
                    {isAdmin && <button onClick={() => setEditData(selectedRoom)} className="w-full py-5 text-[10px] font-black text-gray-700 uppercase tracking-widest hover:text-[#FFBF00] flex items-center justify-center gap-3 border border-white/5 rounded-2xl mt-6 transition-all hover:bg-white/[0.02]"><Settings size={18} /> Manage Asset</button>}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {isAdding && isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#0c0c0c] border border-[#FFBF00]/20 w-full max-w-lg rounded-[2.5rem] p-12 relative shadow-2xl text-center">
              <button onClick={() => { setIsAdding(false); setNewRoom({ unitNumber: '', floor: '', monthlyRent: 0, tenantPhone: '', tenantName: '' }); }} className="absolute top-10 right-10 text-gray-600 hover:text-white transition-colors border border-white/10 p-2 rounded-full"><X size={24} /></button>
              <h2 className="text-4xl font-black italic text-[#FFBF00] mb-10 uppercase tracking-tighter">Register Unit</h2>
              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <input className="bg-black border border-white/10 w-full p-5 rounded-2xl outline-none text-xs focus:border-[#FFBF00]/30 transition-all shadow-inner" placeholder="Unit ID" value={newRoom.unitNumber} onChange={e => setNewRoom({ ...newRoom, unitNumber: e.target.value })} />
                  <input className="bg-black border border-white/10 w-full p-5 rounded-2xl outline-none text-xs focus:border-[#FFBF00]/30 transition-all shadow-inner" placeholder="Floor" value={newRoom.floor} onChange={e => setNewRoom({ ...newRoom, floor: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input className="bg-black border border-white/10 w-full p-5 rounded-2xl outline-none text-xs focus:border-[#FFBF00]/30 transition-all shadow-inner" placeholder="Name" value={newRoom.tenantName || ''} onChange={e => setNewRoom({ ...newRoom, tenantName: e.target.value })} />
                  <input className="bg-black border border-white/10 w-full p-5 rounded-2xl outline-none text-xs focus:border-[#FFBF00]/30 transition-all shadow-inner" placeholder="Mobile" value={newRoom.tenantPhone || ''} onChange={e => setNewRoom({ ...newRoom, tenantPhone: e.target.value })} />
                </div>
                <div><label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-2 mb-2 block text-left">Monthly Rent (₹)</label>
                <input className="bg-black border border-[#FFBF00]/10 w-full p-7 rounded-2xl outline-none font-bold text-4xl text-[#FFBF00] text-center shadow-inner" type="number" placeholder="₹ 0.00" value={newRoom.monthlyRent || ''} onChange={e => setNewRoom({ ...newRoom, monthlyRent: parseInt(e.target.value) || 0 })} /></div>
                <button onClick={handleAddUnit} className="w-full bg-[#FFBF00] text-black font-black py-6 rounded-2xl uppercase tracking-widest text-[12px] hover:scale-105 transition-all shadow-xl mt-6">Save Unit</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isAddingHouse && isSuperAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#0c0c0c] border border-green-500/20 w-full max-w-lg rounded-[2.5rem] p-12 relative shadow-2xl">
              <button onClick={() => setIsAddingHouse(false)} className="absolute top-10 right-10 text-gray-600 hover:text-white transition-colors border border-white/10 p-2 rounded-full"><X size={24} /></button>
              <h2 className="text-4xl font-black italic text-green-500 mb-8 uppercase tracking-tighter text-center">Deploy Property</h2>
              <div className="space-y-6 pt-6 border-t border-white/5">
                <div>
                  <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-2 mb-2 block text-left">Global Tracking ID</label>
                  <input className="bg-black border border-white/10 w-full p-5 rounded-2xl outline-none text-sm font-bold text-white focus:border-green-500/30 transition-all text-center" placeholder="e.g., kphb-101" value={newHouse.id} onChange={e => setNewHouse({ ...newHouse, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-2 mb-2 block text-left">Asset Branding Name</label>
                  <input className="bg-black border border-white/10 w-full p-5 rounded-2xl outline-none text-xl font-black italic text-white focus:border-green-500/30 transition-all text-center" placeholder="Emerald Heights" value={newHouse.name} onChange={e => setNewHouse({ ...newHouse, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-2 mb-2 block text-left">Client Access Password</label>
                  <input className="bg-black border border-white/10 w-full p-5 rounded-2xl outline-none text-sm font-bold text-[#FFBF00] focus:border-green-500/30 transition-all text-center" placeholder="Leave blank to auto-generate" value={newHouse.password || ''} onChange={e => setNewHouse({ ...newHouse, password: e.target.value })} />
                </div>
                <button onClick={handleAddNewHouse} className="w-full bg-green-500 text-black font-black py-6 rounded-2xl uppercase tracking-widest text-[12px] hover:scale-105 transition-all mt-6">Initialize Asset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;