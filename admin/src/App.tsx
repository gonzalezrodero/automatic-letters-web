import { Navigate, RouterProvider, createBrowserRouter, useLocation } from 'react-router-dom'
import { AdminProvider } from './auth/AdminContext'
import { useAuth } from './auth/AuthContext'
import { Shell } from './components/Shell'
import { CallbackPage } from './pages/CallbackPage'
import { ConversationsPage } from './pages/ConversationsPage'
import { DashboardPage } from './pages/DashboardPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { LoginPage } from './pages/LoginPage'
import { SettingsPage } from './pages/SettingsPage'
import { TenantsPage } from './pages/TenantsPage'

function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL
  if (!base || base === '/') return undefined
  return base.endsWith('/') ? base.slice(0, -1) : base
}

function RequireAuth() {
  const { session } = useAuth()
  const location = useLocation()
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return (
    <AdminProvider>
      <Shell />
    </AdminProvider>
  )
}

const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage /> },
    { path: '/auth/callback', element: <CallbackPage /> },
    {
      path: '/',
      element: <RequireAuth />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'conversaciones', element: <ConversationsPage /> },
        { path: 'conversaciones/:conversationId', element: <ConversationsPage /> },
        { path: 'conocimiento', element: <KnowledgePage /> },
        { path: 'ajustes', element: <SettingsPage /> },
        { path: 'organizaciones', element: <TenantsPage /> },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  { basename: routerBasename() },
)

export function App() {
  return <RouterProvider router={router} />
}
