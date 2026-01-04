
import React from 'react';
import { Baby, ShieldCheck, Zap, HeartPulse, ArrowRight, Bot } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center overflow-x-hidden">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-b from-indigo-50 to-white px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in">
          <Bot size={14} /> Agentic Pediatric AI
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1] mb-6 animate-fade-in">
          Your Infant's <span className="text-indigo-600">Health Guardian</span>
        </h1>
        <p className="text-slate-500 text-lg max-w-sm mx-auto mb-10 leading-relaxed animate-fade-in">
          Advanced AI monitoring for vitals, nutrition, and clinical insights—bridging the gap between home care and pediatric expertise.
        </p>
        <button 
          onClick={onStart}
          className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto text-lg"
        >
          Get Started <ArrowRight size={20} />
        </button>
      </div>

      {/* Features Grid */}
      <div className="px-6 grid grid-cols-1 gap-6 w-full max-w-md pb-12">
        <div className="flex gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0">
            <HeartPulse size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Agentic Monitoring</h3>
            <p className="text-sm text-slate-500">Autonomous vitals analysis and real-time emergency alerts.</p>
          </div>
        </div>
        
        <div className="flex gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Clinical Knowledge</h3>
            <p className="text-sm text-slate-500">Grounded in WHO and AAP pediatric guidelines.</p>
          </div>
        </div>

        <div className="flex gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="w-12 h-12 bg-amber-400 text-white rounded-2xl flex items-center justify-center shrink-0">
            <Zap size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Multilingual Support</h3>
            <p className="text-sm text-slate-500">Seamless bridge between Telugu and English pediatric terms.</p>
          </div>
        </div>
      </div>

      <div className="mt-auto p-6 text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest opacity-60">
        Trusted by 50,000+ Caregivers Worldwide
      </div>
    </div>
  );
};
