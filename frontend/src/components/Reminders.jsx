import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Plus, Calendar, Clock, Trash2, CheckCircle2, ChevronRight, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReminders, createReminder, deleteReminder, dismissReminder } from '../api';

export default function Reminders({ planId }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [remindDate, setRemindDate] = useState('');
  const [remindTime, setRemindTime] = useState('09:00');
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchReminders = async () => {
    try {
      const res = await getReminders(planId);
      setReminders(res.data);
    } catch (err) { setError('Failed to load alerts.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReminders(); }, [planId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!message.trim() || !remindDate) return setError('Missing required fields');
    try {
      await createReminder(planId, { message: message.trim(), remind_date: remindDate, remind_time: remindTime });
      setMessage(''); setRemindDate(''); setRemindTime('09:00'); setShowForm(false);
      fetchReminders();
    } catch (err) { setError('Failed to set reminder.'); }
  };

  const activeReminders = reminders.filter(r => r.is_active);
  const dismissedReminders = reminders.filter(r => !r.is_active);
  const todayReminders = activeReminders.filter(r => r.remind_date === today);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
          <Bell className="text-amber-400" />
          Smart Alerts
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-premium px-5 py-2.5 text-sm"
        >
          {showForm ? <X size={20} /> : <div className="flex items-center gap-2"><Plus size={18} /> New Alert</div>}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAdd} className="premium-card p-8 space-y-6 border-indigo-500/30 shadow-glow shadow-indigo-500/10">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Alert Message</label>
                <input
                  type="text"
                  className="w-full px-5 py-3.5 bg-slate-800/50 border border-white/10 rounded-2xl text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-slate-600"
                  placeholder="e.g. Complete review of quantum physics notes"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Target Date</label>
                  <input type="date" className="w-full px-5 py-3.5 bg-slate-800/50 border border-white/10 rounded-2xl text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all" value={remindDate} min={today} onChange={(e) => setRemindDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Time</label>
                  <input type="time" className="w-full px-5 py-3.5 bg-slate-800/50 border border-white/10 rounded-2xl text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all" value={remindTime} onChange={(e) => setRemindTime(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-[0.98]">
                Schedule Notification
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {todayReminders.length > 0 && (
        <div className="p-5 bg-primary-500/10 border border-primary-500/20 rounded-3xl flex items-center gap-5 shadow-glow shadow-primary-500/10">
          <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white ring-4 ring-primary-500/20 animate-pulse">
            <BellRing size={24} />
          </div>
          <div>
            <h4 className="text-white font-black text-sm uppercase tracking-tight">Today's Priority</h4>
            <p className="text-primary-400 text-xs font-bold mt-0.5">{todayReminders.length} Active alerts scheduled for today</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {activeReminders.map(r => (
          <motion.div layout id={r.id} key={r.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300
                ${r.remind_date === today ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-slate-800/40 border-white/5 text-slate-500 group-hover:bg-slate-800/80'}`}>
                <Bell size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold tracking-tight">{r.message}</h4>
                <div className="flex items-center gap-4 mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> {r.remind_date}</span>
                  <span className="flex items-center gap-1.5"><Clock size={12} /> {r.remind_time}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
              <button 
                onClick={() => dismissReminder(r.id).then(fetchReminders)}
                className="p-3 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all border border-emerald-500/20"
              >
                <CheckCircle2 size={20} />
              </button>
              <button 
                onClick={() => deleteReminder(r.id).then(fetchReminders)}
                className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all border border-red-500/20"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </motion.div>
        ))}

        {activeReminders.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 bg-slate-900 border border-white/5 rounded-3xl flex items-center justify-center text-slate-700 mb-6">
              <Bell size={32} />
            </div>
            <h4 className="text-white font-bold italic">Silence is golden.</h4>
            <p className="text-slate-500 text-sm mt-1">But reminders help you win. Create one!</p>
          </div>
        )}
      </div>

      {dismissedReminders.length > 0 && (
        <div className="mt-12 space-y-4 opacity-50 transition-opacity hover:opacity-80">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 pl-2">Dismissed Alerts</h4>
          {dismissedReminders.map(r => (
            <div key={r.id} className="premium-card p-5 flex items-center justify-between border-slate-800">
              <div className="flex items-center gap-4">
                <CheckCircle2 className="text-slate-700" size={18} />
                <span className="text-slate-500 line-through text-sm font-semibold">{r.message}</span>
              </div>
              <button onClick={() => deleteReminder(r.id).then(fetchReminders)} className="text-slate-700 hover:text-red-400 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
