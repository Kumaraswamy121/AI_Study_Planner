import React, { useState } from 'react';
import { X, Save, Clock, Book, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuickEditModal({ session, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    subject: session?.subject || '',
    topic: session?.topic || '',
    duration_minutes: session?.duration_minutes || 25,
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="text-primary-400" size={20} />
              Refine Session
            </h3>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Subject</label>
              <div className="relative">
                <Book className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  placeholder="Subject Name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Focus Topic</label>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="text"
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/5 rounded-2xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  placeholder="Main Topic"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save size={20} />
              Save Adjustments
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
