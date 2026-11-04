import { Outlet } from 'react-router-dom'
import Navbar from './navbar'

const DashboardV2Layout = () => (
  <div className="flex h-screen w-screen flex-col overflow-hidden bg-vsph-grey font-sans">
    <Navbar />
    <main className="flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
)

export default DashboardV2Layout
