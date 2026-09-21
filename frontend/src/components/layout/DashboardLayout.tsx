import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <Outlet />
      </main>
    </div>
  )
}
