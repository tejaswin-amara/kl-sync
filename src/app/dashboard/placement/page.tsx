export default function PlacementPage() {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-100 capitalize">placement</h2>
        <p className="text-base text-zinc-400 text-gray-400 mt-1">Manage your placement details seamlessly.</p>
      </div>
      <div className="card bg-zinc-900/40 backdrop-blur-xl border border-white/5 flex flex-col items-center justify-center text-center min-h-[300px] p-8">
        <div className="w-16 h-16 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
          <span className="material-symbols-outlined text-4xl">work</span>
        </div>
        <h3 className="md-h5 text-zinc-100">Module Active & Syncing</h3>
        <p className="text-sm text-zinc-500 text-gray-400 mt-2 max-w-md">This module is connected to the proxy backend and will automatically sync with newerp.kluniversity.in when full authentication is provided.</p>
      </div>
    </div>
  );
}

