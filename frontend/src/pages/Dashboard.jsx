import React, { useState, useEffect } from "react";
import {
  Phone, Users, Briefcase, TrendingUp, Filter, Calendar,
  ExternalLink, Activity, User, ShieldCheck, Settings, Database,
  Factory, Star, ListChecks, Megaphone, IndianRupee, Percent, Loader2,
} from "lucide-react";
import { api } from "../utils/api";
import Button from "../components/ui/Button";

const ROLE_ICONS = {
  SUPER_ADMIN: ShieldCheck,
  ADMIN: Settings,
  SALES: TrendingUp,
  DATA: Database,
  PRODUCTION: Factory,
  SPONSORSHIP: Star,
  OPERATION: Activity,
  USER: User,
};

const getRoleIcon = (role) => ROLE_ICONS[role] || Star;

const getRoleLabel = (role) => {
  if (!role) return "Dashboard";
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
};

const KPICard = ({ icon: Icon, label, value, sub, tone }) => {
  return (
    <div className={`kpi-card ${tone} ${'hover:shadow-md transition-shadow duration-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-sidebar leading-none mb-1">{value}</p>
          <p className="text-[10px] text-secondary">{sub}</p>
        </div>
        <div className={`kpi-card-icon ${tone.replace('bg-', 'bg-').replace('/10', '/10')}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    callsToday: 0,
    oppsWonThisMonth: 0,
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("vsph_user_id");
    const name = localStorage.getItem("vsph_user_name");
    const role = localStorage.getItem("vsph_user_role");
    if (raw) {
      setUser({ id: raw, name, role });
      api
        .get(`/api/dashboard/metrics?user_id=${raw}`)
        .then((res) => {
          if (res.success) setMetrics(res.data);
        })
        .catch((err) => console.error("Error fetching dashboard metrics:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const RoleIcon = getRoleIcon(user && user.role);

  const kpis = [
    {
      icon: Phone,
      label: "Calls today",
      value: metrics.callsToday,
      sub: "Logged calls",
      tone: "bg-vsph-core-blue/10 text-vsph-core-blue border-vsph-core-blue/20",
    },
    {
      icon: Briefcase,
      label: "Won this month",
      value: metrics.oppsWonThisMonth,
      sub: "Closed won",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      icon: Users,
      label: "Active accounts",
      value: metrics.accounts ?? 0,
      sub: "Total clients",
      tone: "bg-vsph-light-blue/20 text-vsph-core-blue border-vsph-light-blue/20",
    },
    {
      icon: TrendingUp,
      label: "Open opportunities",
      value: metrics.openOpportunities ?? 0,
      sub: "In pipeline",
      tone: "bg-vsph-grey text-vsph-navy border-border",
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-page-bg animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-2 px-8 py-6 surface border-b border-border shrink-0">
        <div className="w-8 h-8 bg-sidebar rounded-lg flex items-center justify-center">
          <span className="text-white text-xl font-bold">V</span>
        </div>
        <span className="text-sidebar font-bold text-xl tracking-tight">VSPH</span>
      </div>

      <div className="page-header px-8 py-6 surface">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">{getRoleLabel(user && user.role)} dashboard</h1>
          <p className="page-subtitle">
            {formattedDate} &bull; {user && user.name || "Loading..."} &bull;{" "}
            {user && user.role ? user.role.replace(/_/g, " ") : "Loading..."}
          </p>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 bg-vsph-core-blue`}>
              <RoleIcon size={28} className="fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-vsph-core-blue uppercase tracking-wider">
                {getRoleLabel(user && user.role)}
              </span>
              <span className="text-3xl font-bold text-sidebar leading-none">{metrics.callsToday}</span>
              <span className="text-xs text-secondary mt-0.5">calls today</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href="#" className="flex items-center gap-2 text-vsph-core-blue hover:text-sidebar">
              <ExternalLink size={14} /> Full report
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-8 pb-8">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-24 text-secondary">
            <Loader2 size={26} className="animate-spin text-vsph-core-blue mr-3" /> Loading dashboard...
          </div>
        ) : (
          kpis.map((kpi) => (
            <KPICard key={kpi.label} {...kpi} />
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
