import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminNav />
      <main className="flex-1 pb-16 md:pb-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
