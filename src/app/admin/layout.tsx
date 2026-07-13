import { DashboardShell } from '@/components/layout/DashboardShell'
import AdminGate from './AdminGate'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <AdminGate>{children}</AdminGate>
    </DashboardShell>
  )
}
