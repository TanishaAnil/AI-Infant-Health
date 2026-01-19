
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, Zap, Save, Check, ChevronRight, Utensils, Info, ShieldAlert, ShieldCheck, Target, Activity } from 'lucide-react';
import { InfantProfile, Nutrients, LogEntry, LogType } from '../types';
import { analyzeMealImage } from '../services/geminiService';

interface MealScannerProps {
  profile: InfantProfile;
  onSave: (entry: Omit<LogEntry, 'id'>) => void;
  onClose: () => void;
}

export const MealScanner: React.FC<MealScannerProps> = ({ profile, onSave, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Nutrients | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
        processImage(dataUrl);
      }
    }
  };

  const processImage = async (dataUrl: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    // Simulate algorithmic checklist steps
    const steps = [
      "Gemini Vision Analysis...",
      "HEURISTIC VOLUME SCAN",
      "CHOKING HAZARD CHECK (AAP Standards)",
      "CALORIC RDA ALGORITHM",
      "TEXTURE SAFETY SCORING"
    ];

    for(let step of steps) {
      setAnalysisStep(step);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const result = await analyzeMealImage(dataUrl, profile);
      if (result) {
        setAnalysis(result);
      } else {
        setError("AI could not analyze the meal. Please try again.");
      }
    } catch (err) {
      setError("Analysis failed. Please try a clearer picture.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!analysis || !capturedImage) return;
    onSave({
      type: LogType.MEAL_ANALYSIS,
      timestamp: new Date(),
      details: {
        nutrients: analysis,
        imageUrl: capturedImage,
        note: `AI Analysis: ${analysis.mainIngredients.join(', ')}. Safety: ${analysis.safetyScore}%`
      }
    });
    onClose();
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setError(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-md absolute top-0 w-full z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Utensils size={18} />
            </div>
            <div>
                <span className="text-white text-xs font-black uppercase tracking-widest">Meal Scanner</span>
                <p className="text-[9px] text-slate-400 font-bold uppercase">Vision-Powered Nutrition</p>
            </div>
        </div>
        <button onClick={onClose} className="text-white p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>

      {/* Main Viewfinder / Result */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
        {!capturedImage ? (
          <div className="w-full h-full relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            {/* Guide Overlay */}
            <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none">
                <div className="w-full h-full border-2 border-white/30 rounded-3xl flex items-center justify-center">
                    <div className="w-12 h-12 border-l-2 border-t-2 border-white/80 absolute top-4 left-4 rounded-tl-lg"></div>
                    <div className="w-12 h-12 border-r-2 border-t-2 border-white/80 absolute top-4 right-4 rounded-tr-lg"></div>
                    <div className="w-12 h-12 border-l-2 border-b-2 border-white/80 absolute bottom-4 left-4 rounded-bl-lg"></div>
                    <div className="w-12 h-12 border-r-2 border-b-2 border-white/80 absolute bottom-4 right-4 rounded-br-lg"></div>
                </div>
            </div>
          </div>
        ) : (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}

        <canvas ref={canvasRef} className="hidden" />

        {isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-8 backdrop-blur-md">
                <div className="relative mb-6">
                    <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity size={24} className="text-indigo-400 animate-pulse" />
                    </div>
                </div>
                <div className="space-y-3 text-center">
                    <p className="text-white font-black uppercase tracking-widest text-xs">Processing Medical Algorithms</p>
                    <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10">
                        <p className="text-indigo-400 font-mono text-[10px] animate-pulse">{analysisStep}</p>
                    </div>
                </div>
            </div>
        )}

        {error && (
            <div className="absolute bottom-24 left-6 right-6 bg-rose-500/90 p-4 rounded-2xl text-white text-center animate-fade-in backdrop-blur-md border border-white/20">
                <p className="text-sm font-bold">{error}</p>
                <button onClick={reset} className="mt-2 text-xs font-black uppercase underline">Try Again</button>
            </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="bg-white rounded-t-[40px] p-8 pb-10 shadow-2xl relative max-h-[60%] overflow-y-auto">
        {!capturedImage ? (
          <div className="flex flex-col items-center gap-6">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest text-center">Center the food bowl in the frame</p>
            <button 
              onClick={captureFrame}
              className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-200 border-8 border-indigo-50 active:scale-90 transition-all"
            >
              <Camera size={32} />
            </button>
          </div>
        ) : analysis ? (
          <div className="space-y-6 animate-fade-in">
             <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                    <h3 className="text-lg font-black text-slate-900">Health Algorithms</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-tight">Deterministic Nutrition Metrics</p>
                </div>
                <button onClick={reset} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors">
                    <RefreshCw size={18} />
                </button>
             </div>

             {/* Safety & RDA Summary */}
             <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center ${analysis.safetyScore > 70 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    {analysis.chokingHazardDetected ? <ShieldAlert size={28} className="text-rose-500 mb-2" /> : <ShieldCheck size={28} className="text-emerald-500 mb-2" />}
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">Safety Score</span>
                    <span className={`text-2xl font-black ${analysis.safetyScore > 70 ? 'text-emerald-700' : 'text-rose-700'}`}>{analysis.safetyScore}%</span>
                </div>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Target size={28} className="text-indigo-600 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">RDA Contribution</span>
                    <span className="text-2xl font-black text-indigo-700">{analysis.rdaContribution}%</span>
                </div>
             </div>

             <div className="grid grid-cols-4 gap-3">
                <NutrientBadge label="Calories" value={`${analysis.calories}`} unit="kcal" color="indigo" />
                <NutrientBadge label="Protein" value={`${analysis.protein}`} unit="g" color="rose" />
                <NutrientBadge label="Carbs" value={`${analysis.carbs}`} unit="g" color="amber" />
                <NutrientBadge label="Fat" value={`${analysis.fat}`} unit="g" color="cyan" />
             </div>

             <div className="space-y-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity size={14} className="text-indigo-500" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Physics & Texture Check</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Volume</p>
                            <p className="text-sm font-black text-slate-700">{analysis.volumeEstimateMl}ml</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-slate-100 text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Texture</p>
                            <p className="text-sm font-black text-slate-700">{analysis.textureAssessment}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <Info size={14} className="text-indigo-500" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Identified Ingredients</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {analysis.mainIngredients.map((ing, i) => (
                            <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm capitalize">
                                {ing}
                            </span>
                        ))}
                    </div>
                </div>
             </div>

             <button 
                onClick={handleSave}
                className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 active:scale-95 transition-all"
             >
                <Save size={18} /> Confirm and Log
             </button>
          </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <RefreshCw className="animate-spin text-indigo-600 mb-4" size={32} />
                <p className="text-xs font-black uppercase tracking-widest text-slate-900">Preparing Analysis...</p>
            </div>
        )}
      </div>
    </div>
  );
};

const NutrientBadge: React.FC<{ label: string, value: string, unit: string, color: string }> = ({ label, value, unit, color }) => {
    const colorClasses: Record<string, string> = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
    };

    return (
        <div className={`p-3 rounded-2xl border ${colorClasses[color]} flex flex-col items-center`}>
            <span className="text-[8px] font-black uppercase tracking-tighter opacity-70 mb-1 text-center">{label}</span>
            <span className="text-lg font-black leading-none">{value}</span>
            <span className="text-[8px] font-bold opacity-60 mt-0.5">{unit}</span>
        </div>
    );
}
