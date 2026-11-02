import React, { useState, useEffect } from "react";
import {
  Phone, Users, Briefcase, TrendingUp, Filter, Calendar,
  ExternalLink, Activity, User, ShieldCheck, Settings, Database,
  Factory, Star, ListChecks, Megaphone, IndianRupee, Percent,
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

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    callsToday: 0,
    oppsWonThisMonth: 0,
  });
  const [user, setUser] = useState(null);

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
        .catch((err) => console.error("Error fetching dashboard metrics:", err));
    }
  }, []);

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const RoleIcon = getRoleIcon(user && user.role);

  return (
    <div className="animate-slide-up flex flex-col min-h-full bg-white">
      <div className="flex items-center gap-2 px-8 py-6 bg-white border-b border-slate-200 shrink-0">
        <div className="w-8 h-8 bg-vsph-navy rounded-lg flex items-center justify-center">
          <span className="text-white text-xl font-bold">V</span>
        </div>
        <span className="text-vsph-navy font-bold text-xl tracking-tight">VSPH</span>
      </div>

      <div className="page-header px-8 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="page-title">
            {getRoleLabel(user && user.role)} dashboard
          </h1>
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
              <span className="text-xs font-semibold text-vsph-core-blue uppercase tracking-wider">
                {getRoleLabel(user && user.role)}
              </span>
              <span className="text-4xl font-bold text-vsph-navy leading-none">{metrics.callsToday}</span>
              <span className="text-xs text-slate-500 mt-0.5">calls today</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href="#" className="flex items-center gap-2 text-vsph-core-blue hover:text-vsph-navy">
              <ExternalLink size={14} /> Full report
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-8 pb-8">
        <MetricCard
          icon={Phone}
          label="Calls today"
          value={metrics.callsToday}
          sub="Logged calls"
          color="bg-vsph-core-blue text-white"
        />
        <MetricCard
          icon={Briefcase}
          label="Won this month"
          value={metrics.oppsWonThisMonth}
          sub="Closed won"
          color="bg-vsph-navy text-white"
        />
        <MetricCard
          icon={Users}
          label="Active accounts"
          value="0"
          sub="Total clients"
          color="bg-vsph-light-blue/20 text-vsph-core-blue"
        />
        <MetricCard
          icon={TrendingUp}
          label="Pipeline value"
          value="$0"
          sub="Open opportunities"
          color="bg-vsph-grey text-vsph-navy"
        />
      </div>
    </div>
  );
};

const MetricCard = ({ icon: Icon, label, value, sub, color }) => {
  return (
    <div className={`card p-6 ${color}`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-vsph-navy leading-none mb-1">{value}</p>
          <p className="text-xs text-slate-400">{sub}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm">
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
