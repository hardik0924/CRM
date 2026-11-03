import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Accounts from './pages/Accounts'
import Opportunities from './pages/Opportunities'
import Projects from './pages/Projects'
import Campaigns from './pages/Campaigns'
import Tasks from './pages/Tasks'
import Team from './pages/Team'
import AcceptInvite from './pages/AcceptInvite'
import Login from './components/login'

// V2 Imports
import LoginV2Layout from './components/v2/login/loginLayout'
import LoginV2 from './components/v2/login/login'
import LoginV2Form from './components/v2/login/loginForm'
import DashboardV2Layout from './components/v2/dashboardLayout'
import DashboardV2 from './components/v2/dashboard'

// Superadmin Portal Imports
import SuperadminLayout from './components/superadmin/SuperadminLayout'
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard'
import TenantManagement from './pages/superadmin/TenantManagement'
import TenantUsers from './pages/superadmin/TenantUsers'
import UsersManagement from './pages/superadmin/UsersManagement'
import ModuleGuard from './components/ModuleGuard'


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/accept-invite" element={<AcceptInvite />} />

      {/* V2 Login Routes */}
      <Route path="/v2/login" element={<LoginV2Layout />}>
        <Route index element={<LoginV2 />} />
        <Route path="superadmin" element={<LoginV2Form role="superadmin" title="Superadmin login" subtitle="Create and manage client accounts" />} />
        <Route path="client" element={<LoginV2Form role="client" title="CRM login" subtitle="Client administrators and employees sign in here" />} />
        <Route path="admin" element={<LoginV2Form role="admin" title="Administrator login" subtitle="Access the CRM as an administrator" />} />
        <Route path="employee" element={<LoginV2Form role="employee" title="Employee login" subtitle="Access your CRM workspace and tasks" />} />
      </Route>

      {/* Superadmin Portal */}
      <Route path="/superadmin" element={<SuperadminLayout />}>
        <Route index element={<SuperadminDashboard />} />
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="tenants/:id/users" element={<TenantUsers />} />
        <Route path="users" element={<UsersManagement />} />
      </Route>

      {/* V2 Client Dashboard */}
      <Route path="/v2" element={<DashboardV2Layout />}>
        <Route path="/v2/dashboard" element={<DashboardV2 />} />
        <Route path="/v2/contacts" element={<ModuleGuard code="CONTACTS"><Contacts /></ModuleGuard>} />
        <Route path="/v2/accounts" element={<ModuleGuard code="ACCOUNTS"><Accounts /></ModuleGuard>} />
        <Route path="/v2/opportunities" element={<ModuleGuard code="OPPORTUNITIES"><Opportunities /></ModuleGuard>} />
        <Route path="/v2/projects" element={<ModuleGuard code="PROJECTS"><Projects /></ModuleGuard>} />
        <Route path="/v2/campaigns" element={<ModuleGuard code="CAMPAIGNS"><Campaigns /></ModuleGuard>} />
        <Route path="/v2/tasks" element={<ModuleGuard code="TASKS"><Tasks /></ModuleGuard>} />
        <Route path="/v2/team" element={<Team />} />
      </Route>

      {/* Legacy Dashboard Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/tasks" element={<Tasks />} />
      </Route>

      {/* Redirect fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App;
