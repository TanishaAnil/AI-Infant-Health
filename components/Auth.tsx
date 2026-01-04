
import React, { useState } from 'react';
import { InfantProfile, AgeGroup, Language, Gender } from '../types';
import { Baby, ArrowRight, Mail, Lock, User, Calendar, Weight, Ruler, Phone } from 'lucide-react';
import { t } from '../utils/translations';

interface AuthProps {
  onAuth: (profile: InfantProfile) => void;
  onBack: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuth, onBack }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState('');
  const [parentName, setParentName] = useState('');
  const [doctorPhone, setDoctorPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [weight, setWeight] = useState('3.5');
  const [height, setHeight] = useState('50');
  const [gender, setGender] = useState<Gender>(Gender.MALE);
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
    if (isLogin) {
      onAuth({
        name: 'Demo Baby',
        parentName: 'Demo Parent',
        doctorPhone: '919999999999',
        birthDate: new Date('2024-01-01'),
        weight: 6.2,
        height: 65,
        gender: Gender.FEMALE,
        ageGroup: AgeGroup.INFANT,
        language: 'en'
      });
      return;
    }

    const bDate = new Date(birthDate);
    onAuth({
      name,
      parentName,
      doctorPhone,
      birthDate: bDate,
      weight: parseFloat(weight),
      height: parseFloat(height),
      gender,
      ageGroup: calculateAgeGroup(bDate),
      language: lang
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 overflow-y-auto">
      <div className="w-full max-w-md mx-auto py-8">
        <button onClick={onBack} className="mb-6 text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-2 text-sm font-bold">
          ← Back to Overview
        </button>

        <div className="bg-white rounded-[32px] shadow-2xl p-8 border border-slate-100 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Baby size={32} />
            </div>
          </div>

          <h2 className="text-2xl font-black text-center text-slate-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Profile'}
          </h2>
          <p className="text-center text-slate-400 text-sm mb-8">
            {isLogin ? 'Access your infant\'s medical dashboard' : 'Start monitoring your child\'s health today'}
          </p>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Signup</button>
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Login</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Baby's Name</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Advik" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Parent's Name</label>
                    <input required type="text" value={parentName} onChange={e => setParentName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Priya" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Pediatrician WhatsApp (with country code)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="tel" value={doctorPhone} onChange={e => setDoctorPhone(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" placeholder="919999999999" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Language</label>
                  <select value={lang} onChange={e => setLang(e.target.value as any)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm font-medium">
                    <option value="en">English (Clinical focus)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Birth Date</label>
                  <input required type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sex</label>
                    <select value={gender} onChange={e => setGender(e.target.value as Gender)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold">
                      <option value={Gender.MALE}>Male</option>
                      <option value={Gender.FEMALE}>Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Weight (kg)</label>
                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Height (cm)</label>
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold" />
                  </div>
                </div>
              </>
            )}

            {isLogin && (
                <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Parent Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input type="email" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" placeholder="email@example.com" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input type="password" required className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-sm" placeholder="••••••••" />
                        </div>
                    </div>
                </div>
            )}

            <button type="submit" className="w-full py-5 mt-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
              {isLogin ? 'Enter Dashboard' : 'Create Medical ID'} <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
