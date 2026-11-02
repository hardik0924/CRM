import React, { useState, useEffect } from "react";
import {
  Clock, Bell, Home, ChevronDown, List, Layers, LayoutGrid, LogOut,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import SearchBar from "./ui/Searchbar";
import Button from "./ui/Button";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("vsph_user_name");
    const savedTenant = localStorage.getItem("vsph_tenant_name");
    if (savedUser) setUser(savedUser);
    if (savedTenant) setTenant(savedTenant);
  }, []);

  const getInitials = (name) => {
    if (!name) return "VS";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="flex flex-col w-full text-white font-sans sticky top-0 z-50 shadow-md">
      <div className="flex items-center justify-between px-8 h-16 bg-vsph-navy">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="iconSm" className="text-vsph-light-blue/80 hover:text-white">
            <LayoutGrid size={20} />
          </Button>
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
            <div className="w-7 h-7 bg-vsph-core-blue rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-bold">V</span>
            </div>
            <span className="text-vsph-core-blue font-bold text-sm tracking-tight uppercase">Vsph</span>
          </Link>
        </div>

        <div className="hidden md:flex w-96">
          <SearchBar />
        </div>

        <div className="flex items-center gap-4">
          {tenant && (
            <Button variant="ghost" size="pill" className="gap-2 border-vsph-core-blue/30 text-vsph-light-blue/90 hover:bg-vsph-core-blue/10">
              <Layers size={14} />
              {tenant}
            </Button>
          )}

          <Button variant="icon" title="Recent Items" className="text-vsph-light-blue/80 hover:text-white">
            <Clock size={20} />
          </Button>

          <Button variant="icon" title="Notifications" className="text-vsph-light-blue/80 hover:text-white">
            <Bell size={20} />
          </Button>

          <div className="flex items-center gap-3 pl-4 border-l border-vsph-core-blue/20">
            <span className="text-xs text-vsph-light-blue/80 hidden sm:inline font-medium">
              {getInitials(user)}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-xs text-vsph-light-blue/80 hover:text-white hover:bg-vsph-core-blue/10 rounded-lg transition-colors border border-transparent hover:border-vsph-core-blue/30"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-8 h-12 bg-vsph-navy border-t border-vsph-core-blue/10 overflow-x-auto no-scrollbar">
        <Button
          variant="ghost"
          size="nav"
          active={
            location.pathname.startsWith("/dashboard") ||
            location.pathname.startsWith("/newdashboard") ||
            location.pathname.startsWith("/v2/dashboard")
          }
          className="gap-2 w-[150px] text-vsph-light-blue/80 hover:text-white border-vsph-core-blue/30"
          onClick={() => navigate("/v2/dashboard")}
        >
          <Home size={16} />
          Home
        </Button>

        <NavDropdownItem
          label="Contacts"
          path="/contacts"
          altPath="/v2/contacts"
          currentPath={location.pathname}
        />
        <NavDropdownItem
          label="Accounts"
          path="/accounts"
          altPath="/v2/accounts"
          currentPath={location.pathname}
        />
        <NavDropdownItem
          label="Opportunities"
          path="/opportunities"
          altPath="/v2/opportunities"
          currentPath={location.pathname}
        />
        <NavDropdownItem
          label="Projects"
          path="/projects"
          altPath="/v2/projects"
          currentPath={location.pathname}
        />
        <NavDropdownItem
          label="Campaigns"
          path="/campaigns"
          altPath="/v2/campaigns"
          currentPath={location.pathname}
        />

        <Button
          variant="ghost"
          size="nav"
          active={location.pathname.startsWith("/tasks")}
          className="gap-2 group w-[150px] text-vsph-light-blue/80 hover:text-white border-vsph-core-blue/30"
          onClick={() => navigate("/v2/tasks")}
        >
          <List size={16} className={
            !location.pathname.startsWith("/tasks")
              ? "group-hover:text-vsph-core-blue transition-colors"
              : ""
          } />
          Tasks
        </Button>
      </div>
    </div>
  );
};

const NavDropdownItem = ({ label, path, altPath, currentPath }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname.startsWith(path) || location.pathname.startsWith(altPath || "");

  return (
    <Button
      variant="ghost"
      size="nav"
      active={isActive}
      className="gap-1.5 w-[150px] text-vsph-light-blue/80 hover:text-white border-vsph-core-blue/30"
      onClick={() => navigate(altPath || path)}
    >
      {label}
      <ChevronDown size={14} />
    </Button>
  );
};

export default Navbar;
