import React, { useState } from 'react';
import { Plus, Trash2, Calendar, Clock, Sparkles, ChevronRight, BookOpen, AlertCircle, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPlan, suggestTopics } from '../api';

const emptySubject = () => ({
  name: '',
  priority: 'medium',
  topics: '',
});

const FloatingInput = ({ label, icon: Icon, ...props }) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors pointer-events-none">
      {Icon && <Icon size={18} />}
    </div>
    <input
      {...props}
      className={`block w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 pt-6 pb-2 text-sm text-white bg-slate-800/40 border border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all peer placeholder-transparent`}
      placeholder={label}
    />
    <label 
      className={`absolute text-xs font-semibold text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] ${Icon ? 'left-12' : 'left-4'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1.5 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-primary-500 pointer-events-none`}
    >
      {label}
    </label>
  </div>
);

export default function PlanForm({ onPlanCreated }) {
  const [subjects, setSubjects] = useState([emptySubject()]);
  const [hoursPerDay, setHoursPerDay] = useState('');
  const [examDate, setExamDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addSubject = () => setSubjects([...subjects, emptySubject()]);
  const removeSubject = (index) => {
    if (subjects.length > 1) setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index, field, value) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    setSubjects(updated);
  };
  
  const [suggesting, setSuggesting] = useState({});

  const handleSuggestTopics = async (index) => {
    const subject = subjects[index].name;
    if (!subject.trim()) return;
    
    setSuggesting(prev => ({ ...prev, [index]: true }));
    try {
      const res = await suggestTopics(subject);
      if (res.data.topics && res.data.topics.length > 0) {
        updateSubject(index, 'topics', res.data.topics.join(', '));
      }
    } catch (err) {
      console.error('Failed to suggest topics:', err);
    } finally {
      setSuggesting(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const validSubjects = subjects.filter(s => s.name.trim() !== '');
      if (validSubjects.length === 0) throw new Error('Add at least one subject');
      if (!hoursPerDay || hoursPerDay <= 0) throw new Error('Invalid study hours');
      if (!examDate) throw new Error('Select an exam date');

      const formatted = validSubjects.map(s => ({
        name: s.name.trim(),
        priority: s.priority,
        topics: s.topics.split(',').map(t => t.trim()).filter(Boolean),
      }));

      const res = await createPlan({
        subjects: formatted,
        hours_per_day: parseFloat(hoursPerDay),
        exam_date: examDate,
      });

      onPlanCreated(res.data);
    } catch (err) {
      setError(err.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Generate New Plan</h2>
          <p className="text-slate-400 mt-1">Fill in your subjects and goals to get started.</p>
        </div>
        <div className="flex items-center gap-3 p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl">
          <Sparkles className="text-primary-400" size={20} />
          <span className="text-sm font-bold text-primary-400">AI Engine Ready</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Subjects Card */}
        <div className="premium-card p-8 shadow-glow">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                <BookOpen size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">Your Subjects</h3>
            </div>
            <button
              type="button"
              onClick={addSubject}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-xl border border-white/5 transition-all"
            >
              <Plus size={16} /> Add More
            </button>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {subjects.map((subject, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-6 bg-slate-800/30 rounded-3xl border border-white/5 relative group"
                >
                  <div className="md:col-span-4">
                    <FloatingInput
                      label="Subject Name"
                      value={subject.name}
                      onChange={(e) => updateSubject(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <div className="relative">
                      <select
                        className="w-full h-[62px] pt-6 pb-2 px-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 appearance-none transition-all"
                        value={subject.priority}
                        onChange={(e) => updateSubject(index, 'priority', e.target.value)}
                      >
                        <option value="high">High Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="low">Low Priority</option>
                      </select>
                      <label className="absolute text-[10px] font-bold uppercase tracking-wider text-slate-500 top-2.5 left-4">Priority</label>
                      <div className={`absolute right-10 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                        subject.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                        subject.priority === 'medium' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      }`} />
                    </div>
                  </div>
                  <div className="md:col-span-4 relative group/topics">
                    <FloatingInput
                      label="Topics (comma separated)"
                      value={subject.topics}
                      onChange={(e) => updateSubject(index, 'topics', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleSuggestTopics(index)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary-500/10 text-primary-400 hover:bg-primary-500 hover:text-white rounded-xl transition-all opacity-0 group-hover/topics:opacity-100 disabled:opacity-50"
                      title="AI Magic: Suggest Topics"
                      disabled={suggesting[index] || !subject.name.trim()}
                    >
                      {suggesting[index] ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Wand2 size={16} />
                      )}
                    </button>
                  </div>
                  <div className="md:col-span-1 pt-3">
                    <button
                      type="button"
                      onClick={() => removeSubject(index)}
                      className="p-3 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      disabled={subjects.length === 1}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Schedule settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="premium-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center text-primary-400">
                <Clock size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">Daily Limit</h3>
            </div>
            <FloatingInput
              icon={Clock}
              type="number"
              label="Hours Per Day (e.g. 4)"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Based on your availability, the AI will distribute subjects to maximize your retention.
            </p>
          </div>

          <div className="premium-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                <Calendar size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">Target Date</h3>
            </div>
            <FloatingInput
              icon={Calendar}
              type="date"
              label="Deadline / Exam Date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              The schedule will be generated to cover all topics before this date.
            </p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400"
          >
            <AlertCircle size={20} />
            <span className="text-sm font-semibold">{error}</span>
          </motion.div>
        )}

        <button
          type="submit"
          className="btn-premium w-full py-5 text-lg group shadow-glow"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          ) : (
            <>
              Generate Smart Plan
              <ChevronRight size={22} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
