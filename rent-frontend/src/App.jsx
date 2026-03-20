import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Database, RefreshCw, Home, Store, X, FileText, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Use the Vercel Environment Variable, or fallback to localhost for development
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

  const fetchUnits = () => {
    setLoading(true);

    // Construct the full endpoint URL
    const endpoint = `${API_BASE_URL}/api/units`;

    fetch(endpoint)
      .then(res => {
        if (!res.ok) throw new Error("Connection Refused");
        return res.json();
      })
      .then(data => {
        setRooms(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Ledger Offline:", err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchUnits(); }, []);

  // Real-time Revenue calculation from the Database
  const totalRevenue = rooms.reduce((acc, room) => acc + (room.monthlyRent || 0), 0);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans selection:bg-[#FFBF00] selection:text-black">
      {/* GLOBAL SCANLINE HUD EFFECT */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-16 border-b border-white/10 pb-10 relative z-10"
      >
        <div>
          <h1 className="text-8xl font-black italic tracking-tighter bg-gradient-to-b from-[#FFBF00] to-[#5c440b] bg-clip-text text-transparent drop-shadow-2xl">LIG-941</h1>
          <p className="text-[10px] tracking-[0.5em] text-gray-500 uppercase font-bold mt-2">Premium Estate Ledger</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={fetchUnits}
          className="p-4 bg-white/5 rounded-full border border-white/10 group"
        >
          <RefreshCw size={20} className="text-[#FFBF00] group-hover:text-white transition-colors" />
        </motion.button>
      </motion.header>

      {/* STAT HUD GRID */}
      <div className="grid grid-cols-2 gap-10 mb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#0c0c0c] to-black p-10 rounded-[2rem] border border-white/5 shadow-2xl"
        >
          <Database size={24} className="text-[#FFBF00] mb-4 opacity-50" />
          <p className="text-6xl font-extralight italic">{rooms.length.toString().padStart(2, '0')} <span className="text-sm not-italic text-gray-600 uppercase">Total Units</span></p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#0c0c0c] to-black p-10 rounded-[2rem] border border-white/5 shadow-2xl"
        >
          <ShieldCheck size={24} className="text-green-500 mb-4 opacity-50" />
          <p className="text-4xl font-bold text-green-500 italic uppercase tracking-tighter">
            ₹{totalRevenue.toLocaleString()}
            <span className="text-[10px] not-italic text-gray-600 uppercase block mt-1">Expected Revenue</span>
          </p>
        </motion.div>
      </div>

      {/* UNIT DATA TABLE */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-black/50 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl relative z-10"
      >
        <table className="w-full text-left">
          <thead className="bg-white/[0.02] border-b border-white/10 text-[#FFBF00] text-[10px] uppercase tracking-[0.4em] font-black">
            <tr><th className="p-8 opacity-40">Unit Designation</th><th className="p-8 opacity-40">Level</th><th className="p-8 opacity-40 text-right">Action</th></tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {rooms.map((room, i) => (
                <motion.tr
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (i * 0.1) }}
                  className="group hover:bg-[#FFBF00]/[0.02] transition-colors border-b border-white/[0.03]"
                >
                  <td className="p-8 flex items-center gap-6 text-4xl font-extralight tracking-tighter group-hover:translate-x-2 transition-all">
                    <div className={`w-3 h-3 rounded-full shadow-[0_0_15px] animate-pulse ${
                      room.isOccupied ? 'bg-red-600 shadow-red-900' : 'bg-green-500 shadow-green-900'
                    }`} />
                    
                    <span className={`flex items-center gap-3 ${room.isOccupied ? 'text-white' : 'text-gray-600'}`}>
                      {room.unitNumber === 'Shutter' ? <Store size={22} className="text-[#FFBF00]" /> : <Home size={22} />}
                      {room.unitNumber}
                    </span>
                  </td>
                  <td className="p-8 text-gray-600 font-mono italic uppercase">{room.floor} Floor</td>
                  <td className="p-8 text-right">
                    <motion.button
                      whileHover={{ scale: 1.05, borderColor: '#FFBF00', color: '#FFBF00' }}
                      onClick={() => setSelectedRoom(room)}
                      className="border border-white/10 px-10 py-3 rounded-full text-[9px] uppercase tracking-widest font-black transition-all"
                    >
                      View Ledger
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* THE DIGITAL LEDGER OVERLAY */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0c0c0c] border border-[#FFBF00]/30 w-full max-w-2xl rounded-[3.5rem] p-12 relative shadow-[0_0_80px_rgba(255,191,0,0.15)]"
            >
              <button onClick={() => setSelectedRoom(null)} className="absolute top-10 right-10 text-gray-500 hover:text-white transition-colors">
                <X size={32} />
              </button>

              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-[#FFBF00]/10 rounded-2xl">
                  <FileText className="text-[#FFBF00]" size={32} />
                </div>
                <div>
                  <h2 className="text-5xl font-black italic tracking-tighter uppercase text-[#FFBF00]">Unit {selectedRoom.unitNumber}</h2>
                  <p className="text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase">Tenant: {selectedRoom.tenantName || "Available"}</p>
                </div>
              </div>

              <div className="space-y-6 border-t border-white/10 pt-10">
                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                  <span className="text-gray-500 uppercase text-[10px] tracking-widest font-black flex items-center gap-2">
                    <Activity size={12} className="text-[#FFBF00]" /> Last Automated Sync
                  </span>
                  <span className="text-sm font-mono text-[#FFBF00] italic">
                    {selectedRoom.lastReminderSent
                      ? new Date(selectedRoom.lastReminderSent).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })
                      : "NEVER_SYNCED"}
                  </span>
                </div>

                <div className="flex justify-between items-end border-b border-white/5 pb-6">
                  <span className="text-gray-500 uppercase text-[10px] tracking-widest font-black">Monthly Rent</span>
                  <span className="text-4xl font-light italic text-white">₹{selectedRoom.monthlyRent?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                  <span className="text-gray-500 uppercase text-[10px] tracking-widest font-black">Current Status</span>
                  <div className="flex flex-col items-end">
                    <span className={`text-2xl font-black italic tracking-tighter ${
                      selectedRoom.isOccupied ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {selectedRoom.isOccupied ? "OCCUPIED" : "AVAILABLE"}
                    </span>
                    <div className={`w-full h-1 mt-1 rounded-full ${selectedRoom.isOccupied ? 'bg-red-900' : 'bg-green-900'}`} />
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-6">
                  <span className="text-gray-500 uppercase text-[10px] tracking-widest font-black">Secure Contact</span>
                  <span className="text-lg text-gray-300 font-mono tracking-tighter">
                    {selectedRoom.tenantPhone ? `+${selectedRoom.tenantPhone}` : "NO_CONTACT_DATA"}
                  </span>
                </div>
              </div>

              <motion.button
                whileHover={selectedRoom.isOccupied ? { scale: 1.02, backgroundColor: '#1ebe5d' } : {}}
                whileTap={selectedRoom.isOccupied ? { scale: 0.98 } : {}}
                disabled={!selectedRoom.isOccupied}
                onClick={() => {
                  const msg = `Hi ${selectedRoom.tenantName}, Rent for Room ${selectedRoom.unitNumber} (₹${selectedRoom.monthlyRent}) is due. Please clear by the 10th. Thank you!`;
                  window.open(`https://wa.me/${selectedRoom.tenantPhone}?text=${encodeURIComponent(msg)}`);
                }}
                className={`w-full mt-10 py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all ${
                  selectedRoom.isOccupied 
                  ? 'bg-[#25D366] text-black shadow-[0_0_30px_rgba(37,211,102,0.2)]' 
                  : 'bg-white/5 text-gray-700 border border-white/5 cursor-not-allowed'
                }`}
              >
                <MessageCircle size={20} fill={selectedRoom.isOccupied ? "black" : "none"} />
                {selectedRoom.isOccupied ? "Manual WhatsApp Reminder" : "Unit Unoccupied"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOOT/SYNC SCREEN */}
      {loading && (
        <motion.div exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
            <Activity size={64} className="text-[#FFBF00]" />
          </motion.div>
          <p className="mt-8 text-[#FFBF00] tracking-[1.5em] text-[10px] uppercase animate-pulse font-black">Syncing Digital Archive</p>
          <div className="w-48 h-[1px] bg-white/10 mt-4 relative overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }} 
              animate={{ x: "100%" }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-[#FFBF00]" 
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default App;