import React, { useState } from 'react';
import { InfantProfile, AgeGroup, Language } from '../types';
import { Baby, ArrowRight, ShieldCheck } from 'lucide-react';
import { t } from '../utils/translations';

interface LoginProps {
  onLogin: (profile: InfantProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [parentName, setParentName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('');
  const [lang, setLang] = useState<Language>('en');

  const calculateAgeGroup = (bDate: Date): AgeGroup => {
    const now = new Date();
    const diffMonths = (now.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (diffMonths <= 3) return AgeGroup.NEWBORN;
    if (diffMonths <= 12) return AgeGroup.INFANT;
    return AgeGroup.TODDLER;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthDate) return;

    const bDate = new Date(birthDate);
    const profile: InfantProfile = {
      name,
      parentName,
      birthDate: bDate,
      weight: parseFloat(weight) || 3.5,
      height: 50, // default
      ageGroup: calculateAgeGroup(bDate),
      language: lang
    };
    onLogin(profile);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 animate-fade-in border border-slate-100">
        <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-full flex items-center justify-center text-white shadow-lg mb-4">
                <Baby size={40} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{t('app_name', lang)}</h1>
            <p className="text-slate-500 text-sm">{t('login_title', lang)}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Language Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button type="button" onClick={() => setLang('en')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${lang === 'en' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>English</button>
                <button type="button" onClick={() => setLang('te')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${lang === 'te' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>తెలుగు</button>
            </div>

            <div className="space-y-3">
                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute top-2 left-3">{t('baby_name', lang)}</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pt-7 pb-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700" placeholder="e.g. Advik" />
                </div>

                <div className="relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute top-2 left-3">{t('parent_name', lang)}</label>
                    <input required type="text" value={parentName} onChange={e => setParentName(e.target.value)} className="w-full pt-7 pb-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700" placeholder="e.g. Priya" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute top-2 left-3">{t('birth_date', lang)}</label>
                        <input required type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full pt-7 pb-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700" />
                    </div>
                    <div className="relative">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute top-2 left-3">{t('weight', lang)}</label>
                        <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full pt-7 pb-2 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700" placeholder="kg" />
                    </div>
                </div>
            </div>

            <button type="submit" className="w-full py-4 mt-6 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                {t('enter_app', lang)} <ArrowRight size={20} />
            </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={14} />
            <span>Secure Local Environment</span>
        </div>
      </div>
    </div>
  );
};
