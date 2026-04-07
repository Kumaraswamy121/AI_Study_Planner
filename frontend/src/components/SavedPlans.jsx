import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, Trash2, ChevronRight, BarChart3, Layers, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPlans, deletePlan } from '../api';

export default function SavedPlans({ onSelectPlan, onViewProgress }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await getPlans();
      setPlans(res.data);
    } catch (err) {
      setError('Connection failed. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Discard this study plan?')) return;
    try {
      await deletePlan(id);
      fetchPlans();
    } catch (err) { setError('Failed to delete plan.'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Your Smart Library</h2>
          <p className="text-slate-400 font-medium text-sm mt-1">Manage and access all your generated study paths.</p>
        </div>
        <button onClick={fetchPlans} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
          <ChevronRight className="rotate-90 text-slate-400" size={20} />
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="premium-card p-20 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-600 mb-6 border border-white/5">
            <BookOpen size={40} />
          </div>
          <h3 className="text-xl font-bold text-white">No plans archived yet</h3>
          <p className="text-slate-500 mt-2 max-w-sm">Create your first personalized study path to see it appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {plans.map((plan) => {
              const subjects = plan.subjects || [];
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={plan.id}
                  onClick={() => onSelectPlan(plan)}
                  className="premium-card p-8 group cursor-pointer hover:bg-slate-800/40 border-l-4 border-l-primary-500/50 hover:border-l-primary-500"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                          <BookOpen size={18} />
                        </div>
                        <h3 className="text-xl font-black text-white group-hover:text-primary-400 transition-colors">
                          {subjects.map(s => s.name).join(', ') || 'General Study Path'}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-500 tracking-wide">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-slate-600" />
                          <span>{plan.hours_per_day}h Daily Limit</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-slate-600" />
                          <span>Target: {plan.exam_date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers size={16} className="text-slate-600" />
                          <span>{subjects.length} Subjects</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {subjects.map((s, i) => (
                          <span key={i} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent
                            ${s.priority === 'high' ? 'bg-red-500/10 text-red-400' : 
                              s.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 
                              'bg-emerald-500/10 text-emerald-400'}`}
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:self-center" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => onViewProgress(plan.id)}
                        className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-2xl border border-white/5 transition-all"
                      >
                        <BarChart3 size={18} className="text-primary-400" /> Analytics
                      </button>
                      <button 
                        onClick={(e) => handleDelete(plan.id, e)}
                        className="p-3 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all border border-transparent hover:border-red-400/20"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
