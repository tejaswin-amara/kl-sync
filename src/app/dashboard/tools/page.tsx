'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wrench, AlertCircle, Percent, Target } from 'lucide-react';
import { SimpleCalculator } from '@/components/attendance-calculator';
import { GlassCard } from '@/components/ui/glass-card';
import { OcrTool } from '@/components/ocr-tool';

export default function ToolsPage() {
  const [totalClasses, setTotalClasses] = useState(0);
  const [presents, setPresents] = useState(0);
  const [cgpa, setCgpa] = useState<number>(0);
  const [completedCredits, setCompletedCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  const [targetCgpa, setTargetCgpa] = useState<string>('9.0');
  const [newCredits, setNewCredits] = useState<string>('24');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const cgpaRes = await fetch('/api/erp-proxy/cgpa');
      const cgpaData = await cgpaRes.json();
      if (cgpaData.success && cgpaData.data) {
         let totalCreds = 0;
         let totalPoints = 0;
         cgpaData.data.forEach((row: any) => {
           const grade = row['Grade']?.trim().toUpperCase();
           const creds = parseFloat(row['Credits']) || 0;
           const point = parseFloat(row['Grade Point']) || 0;
           if (grade && grade !== 'F') {
             totalCreds += creds;
             totalPoints += point * creds;
           }
         });
         setCompletedCredits(totalCreds);
         if (totalCreds > 0) setCgpa(Number((totalPoints / totalCreds).toFixed(2)));
      }

      const yearStr = sessionStorage.getItem('kl_erp_academic_years');
      const semStr = sessionStorage.getItem('kl_erp_semesters');
      let yearId = localStorage.getItem('kl_erp_year') || '';
      let semId = localStorage.getItem('kl_erp_sem') || '';
      if (!yearId && yearStr) yearId = JSON.parse(yearStr)[0]?.value;
      if (!semId && semStr) semId = JSON.parse(semStr)[0]?.value;
      
      if (yearId && semId) {
        const csrf = sessionStorage.getItem('kl_erp_csrf_token');
        const attRes = await fetch('/api/erp-proxy/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ academicYear: yearId, semesterId: semId, csrfToken: csrf })
        });
        const attData = await attRes.json();
        if (attData.success && attData.attendanceData) {
           let totalConducted = 0;
           let totalAttended = 0;
           attData.attendanceData.forEach((row: any) => {
             const condKey = Object.keys(row).find(k => k.toLowerCase().includes('conducted'));
             const attKey = Object.keys(row).find(k => k.toLowerCase().includes('attended'));
             if (condKey && attKey) {
               totalConducted += parseFloat(row[condKey]) || 0;
               totalAttended += parseFloat(row[attKey]) || 0;
             }
           });
           setTotalClasses(totalConducted);
           setPresents(totalAttended);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calculateRequiredGpa = () => {
    const target = parseFloat(targetCgpa);
    const futureCreds = parseFloat(newCredits);
    if (isNaN(target) || isNaN(futureCreds) || futureCreds <= 0) return null;
    
    const currentPoints = cgpa * completedCredits;
    const requiredPoints = (target * (completedCredits + futureCreds)) - currentPoints;
    const requiredGpa = requiredPoints / futureCreds;
    return requiredGpa.toFixed(2);
  };

  const reqGpa = calculateRequiredGpa();

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <Wrench className="w-8 h-8 text-indigo-400" />
            Tools & Calculators
          </h2>
          <p className="text-base text-zinc-400 mt-1">Smart offline tools pre-populated with your live ERP data.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 border border-white/10 rounded-2xl bg-zinc-900/50 backdrop-blur-md">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
          <p className="text-zinc-400">Loading your data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard className="flex flex-col h-full" glowIntensity="medium">
             <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-zinc-950/30">
               <Percent className="w-5 h-5 text-emerald-400" />
               <h3 className="text-lg font-semibold text-zinc-100">Attendance Target</h3>
             </div>
             <div className="p-6 flex-1 flex flex-col gap-6">
               <p className="text-sm text-zinc-400">Your total classes conducted and attended have been synced automatically.</p>
               
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Total Classes</label>
                   <input 
                     type="number" 
                     className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                     value={totalClasses}
                     onChange={e => setTotalClasses(parseInt(e.target.value) || 0)}
                   />
                 </div>
                 <div className="flex-1">
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Classes Attended</label>
                   <input 
                     type="number" 
                     className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                     value={presents}
                     onChange={e => setPresents(parseInt(e.target.value) || 0)}
                   />
                 </div>
               </div>

               <div className="bg-zinc-950/80 rounded-xl overflow-hidden mt-4 shadow-xl border border-white/5">
                 <SimpleCalculator totalClasses={totalClasses} presents={presents} />
               </div>
             </div>
          </GlassCard>

          <GlassCard className="flex flex-col h-full" glowIntensity="medium">
             <div className="p-5 border-b border-white/5 flex items-center gap-3 bg-zinc-950/30">
               <Target className="w-5 h-5 text-purple-400" />
               <h3 className="text-lg font-semibold text-zinc-100">CGPA Goal Predictor</h3>
             </div>
             <div className="p-6 flex-1 flex flex-col gap-6">
               <div className="flex items-center gap-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                 <div className="flex-1 text-center">
                   <p className="text-xs font-bold text-purple-400/80 tracking-widest uppercase mb-1">Current CGPA</p>
                   <p className="text-3xl font-black text-purple-100">{cgpa.toFixed(2)}</p>
                 </div>
                 <div className="w-px h-12 bg-purple-500/20"></div>
                 <div className="flex-1 text-center">
                   <p className="text-xs font-bold text-purple-400/80 tracking-widest uppercase mb-1">Earned Credits</p>
                   <p className="text-3xl font-black text-purple-100">{completedCredits}</p>
                 </div>
               </div>

               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Target CGPA Goal</label>
                   <input 
                     type="number" 
                     step="0.1"
                     className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                     value={targetCgpa}
                     onChange={e => setTargetCgpa(e.target.value)}
                   />
                 </div>
                 <div className="flex-1">
                   <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Upcoming Credits</label>
                   <input 
                     type="number" 
                     className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                     value={newCredits}
                     onChange={e => setNewCredits(e.target.value)}
                   />
                 </div>
               </div>

               <div className="mt-4 p-5 bg-zinc-950/80 border border-white/5 rounded-xl text-center">
                 {reqGpa === null ? (
                   <p className="text-zinc-500 text-sm">Enter valid numbers.</p>
                 ) : parseFloat(reqGpa) > 10 ? (
                   <div>
                     <p className="text-red-400 font-semibold mb-1 flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4"/> Unreachable Goal</p>
                     <p className="text-zinc-400 text-sm">You would need a GPA of <strong className="text-red-300">{reqGpa}</strong>.</p>
                   </div>
                 ) : parseFloat(reqGpa) < 0 ? (
                   <div>
                     <p className="text-emerald-400 font-semibold mb-1 flex items-center justify-center gap-2"><Target className="w-4 h-4"/> Easily Achievable</p>
                   </div>
                 ) : (
                   <div>
                     <p className="text-zinc-300 text-sm mb-2">Required upcoming GPA to hit {targetCgpa}</p>
                     <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">{reqGpa}</p>
                   </div>
                 )}
               </div>

             </div>
          </GlassCard>
          
          <OcrTool />
        </div>
      )}
    </div>
  );
}

