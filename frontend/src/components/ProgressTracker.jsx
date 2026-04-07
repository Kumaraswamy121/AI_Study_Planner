import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ChevronLeft, 
  Edit3, 
  Save, 
  X, 
  LayoutGrid, 
  Layers, 
  TrendingUp, 
  AlertCircle,
  PieChart as PieIcon,
  Search,
  Check,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProgress, toggleTask, updateEntry } from '../api';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area,
  BarChart, Bar
} from 'recharts';

const ProgressBar = ({ percentage, color = 'from-primary-500 to-indigo-600', height = 'h-3' }) => (
  <div className={`w-full ${height} bg-slate-800/80 rounded-full overflow-hidden border border-white/5`}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className={`${height} bg-gradient-to-r ${color} rounded-full relative`}
    >
      <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
    </motion.div>
  </div>
);

export default function ProgressTracker({ planId, onBack }) {
  const [progress, setProgress] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filterDate, setFilterDate] = useState('');

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const res = await getProgress(planId);
      setProgress(res.data.progress);
      setSummary(res.data.summary);
    } catch (err) {
      setError('Connection lost. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProgress(); }, [planId]);

  const handleToggle = async (id) => {
    try {
      await toggleTask(id);
      fetchProgress();
    } catch (err) { setError('Failed to update status'); }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({ subject: item.subject, topic: item.topic, duration_minutes: item.duration_minutes });
  };

  const saveEdit = async () => {
    try {
      await updateEntry(editingId, editData);
      setEditingId(null);
      fetchProgress();
    } catch (err) { setError('Failed to save changes'); }
  };

  const groupedByDate = progress.reduce((acc, item) => {
    const d = item.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  // Data for consistency chart (completed vs time)
  const timelineData = Object.entries(groupedByDate).map(([date, tasks]) => ({
    date,
    completed: tasks.filter(t => t.completed).length,
    total: tasks.length
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Data for subject distribution bar chart
  const subjectDistributionData = summary ? Object.entries(summary.by_subject).map(([name, data]) => ({
    name: name.length > 10 ? name.substring(0, 10) + '..' : name,
    completed: data.completed,
    remaining: data.total - data.completed
  })) : [];

  const uniqueDates = [...new Set(progress.map(p => p.date))].sort();
  const filteredDates = filterDate ? { [filterDate]: groupedByDate[filterDate] || [] } : groupedByDate;
  const today = new Date().toISOString().split('T')[0];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold">Back to Planner</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              className="pl-10 pr-4 py-2 bg-slate-800/60 border border-white/5 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              <option value="">All Timeline</option>
              {uniqueDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Progress Gauge */}
          <div className="lg:col-span-2 premium-card p-8 flex flex-col md:flex-row items-center gap-10 bg-gradient-to-br from-slate-900/40 to-slate-800/20">
            <div className="relative w-48 h-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: summary.percentage },
                      { name: 'Remaining', value: 100 - summary.percentage }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="url(#colorProgress)" />
                    <Cell fill="rgba(255,255,255,0.05)" />
                  </Pie>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-white drop-shadow-glow">{summary.percentage}%</span>
                <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Velocity</span>
              </div>
            </div>
            
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <TrendingUp className="text-primary-400" />
                  Analytics Overview
                </h3>
                <p className="text-slate-400 font-medium text-sm mt-1">
                  You have completed <span className="text-white font-bold">{summary.completed_tasks}</span> out of <span className="text-white font-bold">{summary.total_tasks}</span> sessions.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Status</span>
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={14} /> {summary.percentage > 50 ? 'Strong Pace' : 'Building Momentum'}
                  </span>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Remaining</span>
                  <span className="text-sm font-bold text-white">{summary.total_tasks - summary.completed_tasks} Slots</span>
                </div>
              </div>
              
              <ProgressBar percentage={summary.percentage} height="h-3" />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Consistency / Velocity Chart */}
        <div className="premium-card p-8 h-[400px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Study Consistency</h3>
              <p className="text-xs text-slate-500">Sessions completed over your timeline</p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorComp)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Comparison */}
        <div className="premium-card p-8 h-[400px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Subject Distribution</h3>
              <p className="text-xs text-slate-500">Comparative workload and completion</p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectDistributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="completed" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="remaining" stackId="a" fill="rgba(255,255,255,0.05)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(filteredDates).map(([date, tasks]) => {
          if (!tasks) return null;
          const isOverdue = date < today && tasks.some(t => !t.completed);
          return (
            <motion.div 
              key={date}
              className={`premium-card overflow-hidden ${isOverdue ? 'border-red-500/30' : ''}`}
            >
              <div className={`px-8 py-5 flex items-center justify-between ${isOverdue ? 'bg-red-500/5 border-b border-red-500/10' : 'bg-white/5 border-b border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl border ${isOverdue ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-slate-800 border-white/5 text-slate-400'}`}>
                    <Calendar size={18} />
                  </div>
                  <span className="font-bold text-sm tracking-tight text-white">{date}</span>
                </div>
                {isOverdue && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} /> Critical Attention
                  </span>
                )}
              </div>

              <div className="divide-y divide-white/5">
                {tasks.map((task) => (
                  <div key={task.id} className="group p-8 hover:bg-white/5 transition-all">
                    {editingId === task.id ? (
                      <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-2xl border border-primary-500/20 shadow-glow shadow-primary-500/5">
                        <input className="flex-1 bg-transparent border-none text-white text-sm font-bold focus:ring-0" 
                               value={editData.topic} onChange={(e) => setEditData({...editData, topic: e.target.value})} />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"><Save size={16} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"><X size={16} /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-6 cursor-pointer flex-1 py-1">
                          <input type="checkbox" className="hidden" checked={!!task.completed} onChange={() => handleToggle(task.id)} />
                          <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-300
                            ${task.completed 
                              ? 'bg-emerald-500 border-emerald-500 shadow-glow shadow-emerald-500/30 text-white' 
                              : 'bg-slate-800 border-white/10 text-transparent hover:border-emerald-500 group-hover:scale-110'}`}
                          >
                            <Check absoluteStrokeWidth strokeWidth={4} size={20} />
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-md font-bold tracking-tight transition-all ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                              {task.subject}
                            </span>
                            <span className={`text-xs font-medium ${task.completed ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                              {task.topic}
                            </span>
                          </div>
                        </label>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-500">{task.duration_minutes} min</span>
                          </div>
                          <button onClick={() => startEdit(task)} className="p-2.5 text-slate-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                            <Edit3 size={18} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
