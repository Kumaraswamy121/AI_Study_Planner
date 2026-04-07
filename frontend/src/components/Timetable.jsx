import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronDown, ListChecks, ArrowRight, BookOpen, AlertTriangle, Download, FileDown, Loader2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateEntry, getProgress, exportPlan } from '../api';
import QuickEditModal from './QuickEditModal';

export default function Timetable({ planData, planId, onViewProgress }) {
  const [expandedDays, setExpandedDays] = useState(new Set([0]));
  const [progressData, setProgressData] = useState([]);
  const [editingSession, setEditingSession] = useState(null);

  // Fetch real progress data to allow editing
  const fetchProgress = async () => {
    if (!planId) return;
    try {
      const res = await getProgress(planId);
      setProgressData(res.data.progress);
    } catch (err) {
      console.error('Failed to fetch progress for editing:', err);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [planId]);

  if (!planData || !planData.plan) return null;

  const { schedule, summary, warnings } = planData.plan;

  const toggleDay = (index) => {
    const updated = new Set(expandedDays);
    if (updated.has(index)) updated.delete(index);
    else updated.add(index);
    setExpandedDays(updated);
  };

  const [exporting, setExporting] = useState(false);

  const exportToPDF = async () => {
    try {
      setExporting(true);
      const res = await exportPlan(planId);
      
      // Create a link to download the blob
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `StudyPlan_${planId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Backend PDF Export failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
      case 'medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'low': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Warnings */}
      {warnings?.length > 0 && (
        <div className="space-y-3">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-sm font-medium">
              <AlertTriangle size={18} />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Days', value: summary.total_days, icon: Calendar, color: 'text-primary-400' },
          { label: 'Sessions', value: summary.total_sessions, icon: ListChecks, color: 'text-indigo-400' },
          { label: 'Study Hours', value: `${summary.total_study_hours}h`, icon: Clock, color: 'text-amber-400' },
          { label: 'Hours / Day', value: `${summary.hours_per_day}h`, icon: BookOpen, color: 'text-emerald-400' },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-6 flex flex-col items-center text-center group">
            <stat.icon className={`${stat.color} mb-3 group-hover:scale-110 transition-transform`} size={24} />
            <span className="text-2xl font-black text-white">{stat.value}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <Calendar className="text-primary-400" />
          Smart Timetable
        </h3>
        <div className="flex items-center gap-4">
          <button 
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all active:scale-95 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="animate-spin" size={18} /> : <FileDown size={18} />}
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button 
            onClick={() => onViewProgress(planId)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-95"
          >
            Track My Progress <ArrowRight size={18} />
          </button>
        </div>
      </div>
      

      {/* Days List */}
      <div className="space-y-4">
        {schedule.map((day, dIdx) => (
          <div key={dIdx} className={`premium-card overflow-hidden ${expandedDays.has(dIdx) ? 'ring-2 ring-primary-500/30' : ''}`}>
            <button 
              onClick={() => toggleDay(dIdx)}
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center justify-center p-3 bg-slate-800/80 rounded-2xl border border-white/5 min-w-[70px]">
                  <span className="text-xs font-bold text-primary-400 uppercase tracking-tighter">Day</span>
                  <span className="text-2xl font-black text-white">{day.day_number}</span>
                </div>
                <div className="text-left">
                  <h4 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">{day.day_name}</h4>
                  <p className="text-sm text-slate-500 font-medium">{day.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-400">
                  <span>{day.sessions.filter(s => s.type === 'study').length} Slots</span>
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span>{day.total_minutes} Minutes</span>
                </div>
                <div className={`p-2 rounded-xl bg-white/5 transition-transform duration-300 ${expandedDays.has(dIdx) ? 'rotate-180' : ''}`}>
                  <ChevronDown size={20} className="text-slate-400" />
                </div>
              </div>
            </button>

            <AnimatePresence>
              {expandedDays.has(dIdx) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-slate-900/40"
                >
                  <div className="p-6 pt-0 space-y-3">
                    <div className="h-[1px] bg-white/5 mb-6" />
                    {day.sessions.map((session, sIdx) => (
                      <div key={sIdx} className={`flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border border-white/5 transition-all
                        ${session.type === 'break' ? 'bg-slate-800/20 opacity-60' : 'bg-slate-800/40 hover:bg-slate-800/60'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-xs font-mono font-bold text-primary-400 bg-primary-500/10 px-3 py-1 rounded-lg">
                            {session.start_time} - {session.end_time}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{session.type === 'break' ? '☕ Rest Break' : session.subject}</span>
                            {session.type === 'study' && <span className="text-xs text-slate-400 font-medium tracking-wide mt-0.5 opacity-80">{session.topic}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                          {session.type === 'study' && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  // Find the matching progress row
                                  const progRow = progressData.find(p => p.date === day.date && p.subject === session.subject && p.topic === session.topic);
                                  if (progRow) setEditingSession({ ...session, progress_id: progRow.id });
                                }}
                                className="p-2 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Edit3 size={16} />
                              </button>
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent ${getPriorityStyles(session.priority)}`}>
                                {session.priority}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <QuickEditModal 
        isOpen={!!editingSession} 
        session={editingSession} 
        onClose={() => setEditingSession(null)} 
        onSave={async (data) => {
          try {
            await updateEntry(editingSession.progress_id, data);
            // Refresh local state or re-fetch
            fetchProgress();
            // Note: In a real app, we'd also update the plan_data blob if we wanted persistent timetable layout edits separate from progress tracking.
            // For now, this updates the progress records which is what the tracker uses.
            window.location.reload(); // Quickest way to sync everything since App.jsx holds state
          } catch (err) {
            alert('Failed to update session');
          }
        }} 
      />
    </div>
  );
}
