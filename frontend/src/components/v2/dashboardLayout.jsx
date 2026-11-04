import { Outlet } from 'react-router-dom';
import Navbar from './navbar';

const DashboardV2Layout = () => (
  <div className="flex h-screen w-screen flex-col overflow-hidden bg-vsph-grey font-sans">
    <Navbar />
    <main className="flex-1 overflow-y-auto">
      <div className="px-6 sm:px-8 lg:px-12 py-6">
        <Outlet />
      </div>
    </main>
  </div>
);

export default DashboardV2Layout;
