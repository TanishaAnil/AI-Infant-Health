
import React, { useState } from 'react';
import { InfantProfile, Gender, AgeGroup, MqttConfig } from '../types';
import { User, Calendar, Ruler, Weight, Save, LogOut, Radio, Globe, Hash, Info } from 'lucide-react';

interface ProfileSettingsProps {
  profile: InfantProfile;
  onUpdate: (updated: InfantProfile) => void;
  onLogout: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onUpdate, onLogout }) => {
  const [formData, setFormData] = useState<InfantProfile>(profile);

  const calculateAgeGroup = (bDate: Date): AgeGroup => {
    const now = new Date();
    const diffMonths = (now.getTime() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (diffMonths <= 3) return AgeGroup.NEWBORN;
    if (diffMonths <= 12) return AgeGroup.INFANT;
    return AgeGroup.TODDLER;
  };

  const handleSave = () => {
    const updated = {
      ...formData,
      birthDate: new Date(formData.birthDate),
      ageGroup: calculateAgeGroup(new Date(formData.birthDate))
    };
    onUpdate(updated);
    alert("Profile Updated Successfully!");
  };

  const updateMqtt = (updates: Partial<MqttConfig>) => {
    setFormData({
      ...formData,
      mqttConfig: {
        ...(formData.mqttConfig || { brokerUrl: 'wss://broker.hivemq.com:8000/mqtt', topic: 'iot/ikram/mlx90614/object', enabled: false }),
        ...updates
      }
    });
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in pb-20">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-black text-slate-900">Profile Settings</h2>
        <button onClick={onLogout} className="text-rose-500 p-2 bg-rose-50 rounded-xl">
          <LogOut size={20} />
        </button>
      </div>

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6">
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Baby's Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" 
            />
          </div>
        </div>

        {/* Real-time MQTT Config Section */}
        <div className="pt-4 border-t border-slate-100">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <Radio size={18} className="text-indigo-600" />
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">IR Sensor Config (MLX90614)</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.mqttConfig?.enabled} 
                  onChange={(e) => updateMqtt({ enabled: e.target.checked })}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
           </div>
           
           <div className={`space-y-4 transition-all ${formData.mqttConfig?.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-2">
                  <Info size={16} className="text-amber-600 shrink-0" />
                  <p className="text-[9px] text-amber-800 font-bold leading-tight">
                    MQTT over WebSockets is required for browsers. Ensure your broker (e.g. Mosquitto) has WebSockets enabled on port 8000/9001. Use wss:// for secure sites.
                  </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">MQTT Broker (WebSocket URL)</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    value={formData.mqttConfig?.brokerUrl} 
                    onChange={e => updateMqtt({ brokerUrl: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-[10px]" 
                    placeholder="ws://10.32.0.148:9001"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Object Temp Topic</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="text" 
                    value={formData.mqttConfig?.topic} 
                    onChange={e => updateMqtt({ topic: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-[10px]" 
                    placeholder="iot/ikram/mlx90614/object"
                  />
                </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Weight (kg)</label>
            <div className="relative">
              <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="number" 
                step="0.1"
                value={formData.weight} 
                onChange={e => setFormData({...formData, weight: parseFloat(e.target.value)})}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" 
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Height (cm)</label>
            <div className="relative">
              <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="number" 
                value={formData.height} 
                onChange={e => setFormData({...formData, height: parseFloat(e.target.value)})}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sex</label>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
            {[Gender.MALE, Gender.FEMALE].map(g => (
              <button
                key={g}
                onClick={() => setFormData({...formData, gender: g})}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.gender === g ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full py-5 bg-emerald-600 text-white rounded-[24px] font-black shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
        >
          <Save size={18} /> Save Changes
        </button>
      </div>
    </div>
  );
};
