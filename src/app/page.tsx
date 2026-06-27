import { Suspense } from 'react'
import { ERPDashboard } from '@/components/calculator/erp'

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ color: 'rgba(239,239,239,.35)', fontSize: '.875rem', fontFamily: 'monospace' }}>
        Loading…
      </div>
    }>
      <ERPDashboard />
    </Suspense>
  )
}
