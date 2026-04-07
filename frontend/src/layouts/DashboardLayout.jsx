import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  PlusCircle, 
  Settings, 
  Bell, 
  Home, 
  LogOut,
  Menu,
  X,
  BookOpen,
  PieChart,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ icon: Icon, label, active, onClick, id }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group
      ${active 
        ? 'bg-primary-500 text-white shadow-glow' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
  >
    <Icon size={22} className={active ? 'text-white' : 'group-hover:scale-110 transition-transform duration-200'} />
    <span className="font-semibold text-sm tracking-wide">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-nav"
        className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
      />
    )}
  </button>
);

export default function DashboardLayout({ children, activeTab, setActiveTab }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { id: 'create', label: 'Create Plan', icon: PlusCircle },
    { id: 'timetable', label: 'My Planner', icon: Calendar },
    { id: 'progress', label: 'Track Progress', icon: PieChart },
    { id: 'plans', label: 'Saved Library', icon: BookOpen },
    { id: 'reminders', label: 'Reminders', icon: Bell },
  ];

  return (
    <div className="flex min-h-screen bg-background-dark text-slate-200 overflow-hidden font-['Inter',_sans-serif]">
      {/* Sidebar */}
      <AnimatePresence mode='wait'>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/60 backdrop-blur-2xl border-r border-white/5 p-6 flex flex-col gap-8"
          >
            {/* Logo */}
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-glow animate-premium-float">
                <BookOpen size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  StudyAI
                </h1>
                <p className="text-[10px] text-primary-400 uppercase tracking-widest font-bold">Smart Planner</p>
              </div>
            </div>

            {/* Nav List */}
            <nav className="flex flex-col gap-2 mt-4">
              {navItems.map((item) => (
                <SidebarItem
                  key={item.id}
                  id={item.id}
                  icon={item.icon}
                  label={item.label}
                  active={activeTab === item.id}
                  onClick={setActiveTab}
                />
              ))}
            </nav>

            {/* Profile / Account (Bottom) */}
            <div className="mt-auto pt-6 border-t border-white/5">
              <div className="flex items-center gap-3 px-2 py-3 bg-white/5 rounded-2xl mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                  <User size={20} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Student User</p>
                  <p className="text-[10px] text-slate-500">Free Tier</p>
                </div>
              </div>
              <button className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={20} />
                <span className="font-semibold text-sm">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'pl-72' : 'pl-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 h-20 bg-background-dark/50 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h2 className="text-lg font-bold tracking-tight text-white capitalize">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all relative group">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900 group-hover:scale-125 transition-transform" />
              </button>
            </div>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <button className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-xs font-bold shadow-sm">
                SU
              </div>
              <span className="text-sm font-semibold hidden md:block">Settings</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="p-8 max-w-6xl mx-auto min-h-[calc(100vh-80px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
