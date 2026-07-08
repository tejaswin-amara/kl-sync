'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/glass-card';
import { Loader2, AlertCircle, Inbox, ChevronDown, TrendingUp, TrendingDown, AlertTriangle, CalendarOff, Armchair, Megaphone, Bed, Book, CheckCircle, Clock } from 'lucide-react';
import Cookies from 'js-cookie';

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem('kl_student_profile');
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
      } catch (e) {}
    }

    fetch(`/api/fetch-profile?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => {
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          throw new Error('Session expired or server error. Please login again.');
        }
        return res.json();
      })
      .then(resData => {
        if (!resData.success) {
          throw new Error(resData.error || 'Failed to fetch data');
        }
        setData(resData.data || {});
        localStorage.setItem('kl_student_profile', JSON.stringify(resData.data || {}));
      })
      .catch(err => {
        if (err.message.includes('Session expired') || err.message.includes('Unauthorized')) {
          localStorage.removeItem('kl_student_profile');
          // Dispatch a custom event to force sign out, or redirect directly
          Cookies.remove('kl_erp_session');
          window.location.href = '/';
        } else if (!cached) {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Profile</h2>
        <p className="text-base text-zinc-400 text-gray-400 mt-1">Manage your academic profile details.</p>
      </div>

      {loading ? (
        <div className="card bg-zinc-900/40 backdrop-blur-xl border border-white/5 min-h-[400px] flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
          <span className="text-base text-zinc-400 text-gray-400">Syncing your profile...</span>
        </div>
      ) : error ? (
        <div className="card bg-zinc-900/40 backdrop-blur-xl border border-white/5 min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
            <AlertCircle className="w-10 h-10" />
          </div>
          <p className="md-h5 text-red-400">Failed to load profile</p>
          <p className="text-sm text-zinc-500 text-gray-400 mt-2 max-w-md">{error}</p>
        </div>
      ) : data ? (
        <div className="card bg-zinc-900/40 backdrop-blur-xl border border-white/5 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-[var(--color-primary-variant)] p-4 sm:p-6 relative">
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded bg-zinc-950/50 backdrop-blur-md border-2 border-[var(--color-primary)] shadow-md flex items-center justify-center text-zinc-100 text-3xl overflow-hidden relative">
                {data.universityId ? (
                  <img 
                    src={data.photoUrl ? `/api/fetch-photo?path=${encodeURIComponent(data.photoUrl)}` : `/api/fetch-photo?id=${data.universityId}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
                <span className="z-0 relative">{data.name ? data.name.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <div className="text-center sm:text-left text-[var(--color-on-primary)] pb-1 z-20">
                <h3 className="text-3xl font-bold tracking-tight">{data.name || 'Unknown Student'}</h3>
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-black/20 rounded">
                  
                  <span className="text-xs text-zinc-500 font-mono tracking-wider tracking-wider">ID: {data.universityId || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Details Grid */}
          <div className="p-4 sm:p-6 bg-zinc-950/50 backdrop-blur-md">
            <h4 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              All Information
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
               {(() => {
                 let displayData: Record<string, string> = {};
                 
                 // If extended profile is available, parse it and use it.
                 // Otherwise fallback to the legacy standard data keys.
                 if (data.extendedProfile) {
                   try {
                     displayData = JSON.parse(data.extendedProfile);
                   } catch (e) {}
                 } else {
                   displayData = { ...data };
                 }

                 return Object.entries(displayData)
                   .filter(([k]) => !['name', 'universityId', 'photoUrl', 'extendedProfile', 'success', 'rawHtmlLength'].includes(k))
                   .map(([k, v]) => (
                    <div key={k} className="flex flex-col p-2.5 bg-[#2c2c2c] rounded border border-white/10 hover:border-[var(--color-primary)]/50 transition-colors">
                      <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 text-gray-400 truncate" title={k}>
                        {k.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-xs text-zinc-100 truncate" title={String(v)}>{String(v) || 'Not Provided'}</span>
                    </div>
                 ));
               })()}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

