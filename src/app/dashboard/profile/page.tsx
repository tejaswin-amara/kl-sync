'use client';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fetch-profile')
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
      })
      .catch(err => setError(err.message))
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
          <span className="material-symbols-outlined text-4xl text-indigo-400 animate-spin mb-4">progress_activity</span>
          <span className="text-base text-zinc-400 text-gray-400">Syncing your profile...</span>
        </div>
      ) : error ? (
        <div className="card bg-zinc-900/40 backdrop-blur-xl border border-white/5 min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded bg-[#CF6679]/10 flex items-center justify-center text-[#CF6679] mb-4">
            <span className="material-symbols-outlined text-4xl">error</span>
          </div>
          <p className="md-h5 text-[#CF6679]">Failed to load profile</p>
          <p className="text-sm text-zinc-500 text-gray-400 mt-2 max-w-md">{error}</p>
        </div>
      ) : data ? (
        <div className="card bg-zinc-900/40 backdrop-blur-xl border border-white/5 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-[var(--color-primary-variant)] p-8 sm:p-12 relative">
            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
              <div className="w-32 h-32 rounded bg-[var(--color-surface)] border-2 border-[var(--color-primary)] shadow-md flex items-center justify-center text-zinc-100 text-5xl md-h3 overflow-hidden relative">
                {data.universityId ? (
                  <img 
                    src={`https://newerp.kluniversity.in/uploads/studentphotos/${data.universityId}.jpg`} 
                    alt="Profile" 
                    className="w-full h-full object-cover absolute inset-0 z-10"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
                <span className="z-0 relative">{data.name ? data.name.charAt(0).toUpperCase() : 'U'}</span>
              </div>
              <div className="text-center sm:text-left text-[var(--color-on-primary)] pb-2 z-20">
                <h3 className="text-3xl font-bold tracking-tight">{data.name || 'Unknown Student'}</h3>
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-black/20 rounded">
                  <span className="material-symbols-outlined text-[16px]">badge</span>
                  <span className="text-xs text-zinc-500 font-mono tracking-wider tracking-wider">ID: {data.universityId || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profile Details Grid */}
          <div className="p-8 bg-[var(--color-surface)]">
            <h4 className="md-h6 text-zinc-100 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">person</span>
              Personal Information
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {Object.entries(data).filter(([k]) => k !== 'name' && k !== 'universityId').map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1 p-4 bg-[#2c2c2c] rounded border border-[#333] hover:border-[var(--color-primary)]/50 transition-colors">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 text-gray-400">
                      {k.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-base text-zinc-400 text-zinc-100 break-words">{String(v) || 'Not Provided'}</span>
                  </div>
               ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

