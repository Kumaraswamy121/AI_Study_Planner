import React, { useState, useEffect } from 'react';
import './index.css';
import DashboardLayout from './layouts/DashboardLayout';
import PlanForm from './components/PlanForm';
import Timetable from './components/Timetable';
import ProgressTracker from './components/ProgressTracker';
import SavedPlans from './components/SavedPlans';
import Reminders from './components/Reminders';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check health on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/health');
        if (res.ok) setBackendStatus('connected');
        else throw new Error();
      } catch {
        setBackendStatus('disconnected');
      }
    };
    checkConnection();
  }, []);

  const handlePlanCreated = (data) => {
    setCurrentPlan(data);
    setCurrentPlanId(data.id);
    setActiveTab('timetable');
  };

  const handleSelectPlan = (plan) => {
    setCurrentPlan({ id: plan.id, plan: plan.plan_data });
    setCurrentPlanId(plan.id);
    setActiveTab('timetable');
  };

  const handleViewProgress = (id) => {
    setCurrentPlanId(id);
    setActiveTab('progress');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'create':
        return <PlanForm onPlanCreated={handlePlanCreated} />;
      case 'timetable':
        if (!currentPlan) return (
          <div className="flex flex-col items-center justify-center p-20 premium-card text-center">
            <h3 className="text-xl font-bold text-white italic">Empty Canvas.</h3>
            <p className="text-slate-500 mt-2 max-w-xs">You haven't selected a study path yet. Create one to visualize your future.</p>
            <button onClick={() => setActiveTab('create')} className="btn-premium mt-6">Design New Path</button>
          </div>
        );
        return <Timetable planData={currentPlan} planId={currentPlanId} onViewProgress={handleViewProgress} />;
      case 'progress':
        if (!currentPlanId) return (
          <div className="flex flex-col items-center justify-center p-20 premium-card text-center">
            <h3 className="text-xl font-bold text-white italic">No Trajectory Set.</h3>
            <p className="text-slate-500 mt-2 max-w-xs">Select an existing plan from your library to track your velocity.</p>
            <button onClick={() => setActiveTab('plans')} className="btn-premium mt-6">Open Library</button>
          </div>
        );
        return <ProgressTracker planId={currentPlanId} onBack={() => setActiveTab('timetable')} />;
      case 'plans':
        return <SavedPlans onSelectPlan={handleSelectPlan} onViewProgress={handleViewProgress} />;
      case 'reminders':
        if (!currentPlanId) return (
          <div className="flex flex-col items-center justify-center p-20 premium-card text-center">
            <h3 className="text-xl font-bold text-white italic">Alerts Muted.</h3>
            <p className="text-slate-500 mt-2 max-w-xs">Reminders are plan-specific. Activate a plan first to manage notifications.</p>
          </div>
        );
        return <Reminders planId={currentPlanId} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <AnimatePresence mode="wait">
        {backendStatus === 'disconnected' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-500/20 text-red-500 rounded-xl">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="text-white font-bold">Backend Offline</h4>
                <p className="text-red-400/70 text-sm font-medium">Please run 'python app.py' in the backend directory.</p>
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="p-3 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
            >
              <RefreshCw size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {renderContent()}
    </DashboardLayout>
  );
}
