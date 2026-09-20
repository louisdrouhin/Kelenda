import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { ToastProvider } from './components/ui/toast-context'
import { AuthProvider } from './features/auth/auth-context'
import { LoginPage } from './features/auth/pages/LoginPage'
import { SignupPage } from './features/auth/pages/SignupPage'
import { CalendarPage } from './features/calendar/pages/CalendarPage'
import { HomePage } from './features/dashboard/pages/HomePage'
import { FinancePage } from './features/finance/pages/FinancePage'
import { MissionsPage } from './features/missions/pages/MissionsPage'
import { NotificationsPage } from './features/notifications/pages/NotificationsPage'
import { RevisionsPage } from './features/revisions/pages/RevisionsPage'
import { SettingsPage } from './features/settings/pages/SettingsPage'
import { queryClient } from './lib/query-client'
import { ProtectedRoute } from './routes/ProtectedRoute'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<HomePage />} />
                <Route path="/calendrier" element={<CalendarPage />} />
                <Route path="/revisions" element={<RevisionsPage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/missions" element={<MissionsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/parametres" element={<SettingsPage />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
