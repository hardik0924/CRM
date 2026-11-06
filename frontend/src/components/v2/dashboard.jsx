import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Phone,
  Trophy,
  Briefcase,
  Users,
  TrendingUp,
  ListChecks,
  ArrowRight,
  Loader2,
  Sparkles,
  Megaphone,
  Layers,
  RefreshCw,
  UserPlus,
  ClipboardList,
  Radio,
} from "lucide-react";
import { api } from "../../utils/api";
import { hasModule } from "../../utils/modules";

const STAGE_COLORS = {
  PITCH_DONE: "bg-vsph-core-blue",
  FOLLOW_UP: "bg-vsph-light-blue",
  CONTRACT_OUT: "bg-amber-400",
  CLOSED_WON: "bg-emerald-500",
  CLOSED_LOST: "bg-rose-400",
  UNASSIGNED: "bg-slate-300",
};

const STAGE_HEX = {
  PITCH_DONE: "#0069C8",
  FOLLOW_UP: "#50C0E8",
  CONTRACT_OUT: "#FBBF24",
  CLOSED_WON: "#10B981",
  CLOSED_LOST: "#FB7185",
  UNASSIGNED: "#CBD5E1",
};

const PRIORITY_COLORS = {
  HIGH: "bg-rose-50 text-rose-700",
  NORMAL: "bg-vsph-grey text-vsph-navy",
  LOW: "bg-emerald-50 text-emerald-700",
};

const label = (value) =>
  (value || "-").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const STATUS_COLORS = {
  TODO: "bg-slate-100 text-slate-600 border-slate-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-100",
  BLOCKED: "bg-amber-50 text-amber-700 border-amber-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const statusLabel = (status) =>
  (status || "TODO").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const ACTIVITY_META = {
  call: { icon: Phone, className: "bg-vsph-core-blue/10 text-vsph-core-blue", verb: "logged a call" },
  contact: { icon: UserPlus, className: "bg-vsph-light-blue/20 text-vsph-core-blue", verb: "added a contact" },
  account: { icon: Briefcase, className: "bg-sidebar/10 text-sidebar", verb: "added an account" },
  opportunity: { icon: TrendingUp, className: "bg-amber-50 text-amber-600", verb: "added an opportunity" },
  task: { icon: ClipboardList, className: "bg-rose-50 text-rose-600", verb: "created a task" },
};

const timeAgo = (value) => {
  if (!value) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
};

const weekday = (isoDate) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "short" });
};

const PipelineDonut = ({ pipeline, onSelect }) => {
  const total = pipeline.reduce((sum, row) => sum + row.count, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (!total) {
    return <p className="text-sm text-secondary">No opportunities yet.</p>;
  }

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="16" />
        {pipeline.map((row) => {
          const length = (row.count / total) * circumference;
          const segment = (
            <circle
              key={row.stage}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={STAGE_HEX[row.stage] || "#94A3B8"}
              strokeWidth="16"
              strokeDasharray={`${Math.max(length - 2, 0)} ${circumference}`}
              strokeDashoffset={-offset}
              className="cursor-pointer transition-opacity hover:opacity-70"
              onClick={() => onSelect?.(row.stage)}
            >
              <title>{`${label(row.stage)}: ${row.count}`}</title>
            </circle>
          );
          offset += length;
          return segment;
        })}
      </svg>
      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <p className="text-2xl font-bold text-sidebar leading-none">{total.toLocaleString()}</p>
          <p className="text-[10px] uppercase tracking-wider text-secondary font-semibold mt-1">In pipeline</p>
        </div>
        <div className="space-y-1.5">
          {pipeline
            .filter((row) => row.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
            .map((row) => (
              <button
                key={row.stage}
                type="button"
                onClick={() => onSelect?.(row.stage)}
                className="flex w-full items-center gap-2 text-[11px] text-slate-600 hover:text-vsph-navy"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: STAGE_HEX[row.stage] || "#94A3B8" }}
                />
                <span className="truncate">{label(row.stage)}</span>
                <span className="ml-auto font-semibold">{row.count}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

const CallVolumeChart = ({ data }) => {
  const max = Math.max(...data.map((row) => row.count), 1);
  const total = data.reduce((sum, row) => sum + row.count, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-2xl font-bold text-sidebar leading-none">{total.toLocaleString()}</p>
          <p className="text-[10px] uppercase tracking-wider text-secondary font-semibold mt-1">Calls · last 7 days</p>
        </div>
        <span className="text-[10px] text-secondary">peak {max}</span>
      </div>
      <div className="mt-4 flex items-end gap-2 h-28">
        {data.map((row) => (
          <div key={row.date} className="flex-1 flex flex-col items-center gap-1.5 group">
            <span className="text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {row.count}
            </span>
            <div className="w-full flex items-end justify-center h-20">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-vsph-core-blue to-vsph-light-blue transition-all duration-500 group-hover:from-vsph-navy group-hover:to-vsph-core-blue"
                style={{ height: `${Math.max((row.count / max) * 100, row.count ? 6 : 0)}%` }}
                title={`${row.date}: ${row.count} calls`}
              />
            </div>
            <span className="text-[10px] text-secondary">{weekday(row.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardV2 = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const userName = localStorage.getItem("vsph_user_name") || "there";
  const userRole = (localStorage.getItem("vsph_user_role") || "USER").replace(/_/g, " ");
  const navigate = useNavigate();

  const load = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await api.get("/api/dashboard/metrics");
      if (res.success) {
        setMetrics(res.data);
        setLastUpdated(new Date());
        setError("");
      } else if (!silent) {
        setError(res.message || "Could not load dashboard data.");
      }
    } catch {
      if (!silent) setError("Could not reach the CRM API.");
    } finally {
      if (!silent) {
        setRefreshing(false);
        setLoading(false);
      }
    }
  }, []);

  // Keep the dashboard live for everyone: refresh every 20s while the tab is
  // visible, and immediately when it comes back to the foreground.
  useEffect(() => {
    load();
    const interval = setInterval(() => {
      if (!document.hidden) load(true);
    }, 20000);
    const onVisible = () => {
      if (!document.hidden) load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const personal = metrics?.scope === "PERSONAL";

  const cards = metrics
    ? [
        metrics.callsToday !== null && {
          key: "calls",
          label: "Calls today",
          value: metrics.callsToday,
          hint: personal ? "Logged by you" : "Logged by your team",
          icon: Phone,
          tone: "bg-vsph-core-blue/10 text-vsph-core-blue border-vsph-core-blue/20",
          path: null,
        },
        metrics.oppsWonThisMonth !== null && {
          key: "won",
          label: "Won this month",
          value: metrics.oppsWonThisMonth,
          hint: personal ? "Closed won · you" : "Closed won · team",
          icon: Trophy,
          tone: "bg-emerald-50 text-emerald-600 border-emerald-100",
          path: "/v2/opportunities",
          module: "OPPORTUNITIES",
        },
        metrics.accounts !== null && {
          key: "accounts",
          label: "Accounts",
          value: metrics.accounts,
          hint: "Active records",
          icon: Briefcase,
          tone: "bg-sidebar/10 text-sidebar border-sidebar/20",
          path: "/v2/accounts",
          module: "ACCOUNTS",
        },
        metrics.contacts !== null && {
          key: "contacts",
          label: "Contacts",
          value: metrics.contacts,
          hint: "Active records",
          icon: Users,
          tone: "bg-vsph-light-blue/20 text-vsph-core-blue border-vsph-light-blue/20",
          path: "/v2/contacts",
          module: "CONTACTS",
        },
        metrics.openOpportunities !== null && {
          key: "open",
          label: "Open opportunities",
          value: metrics.openOpportunities,
          hint: "In pipeline",
          icon: TrendingUp,
          tone: "bg-amber-50 text-amber-600 border-amber-100",
          path: "/v2/opportunities",
          module: "OPPORTUNITIES",
        },
        metrics.openTasks !== null && {
          key: "tasks",
          label: metrics.work?.scope === "PERSONAL" ? "My open tasks" : "Open tasks",
          value: metrics.openTasks,
          hint: metrics.work?.scope === "PERSONAL" ? "Assigned to you" : "Across the team",
          icon: ListChecks,
          tone: "bg-rose-50 text-rose-600 border-rose-100",
          path: "/v2/tasks",
          module: "TASKS",
        },
      ].filter(Boolean)
    : [];

  const totalPipeline = metrics?.pipeline?.reduce((sum, row) => sum + row.count, 0) || 0;

  const quickActions = [
    { label: "New Contact", path: "/v2/contacts", icon: Users, module: "CONTACTS", color: "bg-vsph-core-blue/10 text-vsph-core-blue border-vsph-core-blue/20" },
    { label: "New Account", path: "/v2/accounts", icon: Briefcase, module: "ACCOUNTS", color: "bg-sidebar/10 text-sidebar border-sidebar/20" },
    { label: "New Opportunity", path: "/v2/opportunities", icon: TrendingUp, module: "OPPORTUNITIES", color: "bg-amber-50 text-amber-600 border-amber-100" },
    { label: "New Task", path: "/v2/tasks", icon: ListChecks, module: "TASKS", color: "bg-rose-50 text-rose-600 border-rose-100" },
    { label: "New Campaign", path: "/v2/campaigns", icon: Megaphone, module: "CAMPAIGNS", color: "bg-vsph-light-blue/20 text-vsph-core-blue border-vsph-light-blue/20" },
    { label: "New Project", path: "/v2/projects", icon: Layers, module: "PROJECTS", color: "bg-vsph-grey text-vsph-navy border-border" },
  ];

  return (
    <div className="min-h-full bg-page-bg p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-vsph-core-blue uppercase tracking-wider">{today}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-sidebar tracking-tight mt-1">
              Welcome back, {userName}
            </h1>
            <p className="text-secondary text-sm mt-1">
              Signed in as {userRole}. {personal ? "Here is your work right now." : "Here is what your organization is doing right now."}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-border bg-white text-[11px] font-semibold text-slate-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live
              {lastUpdated && (
                <span className="font-normal text-slate-400">
                  · {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => load()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-white text-[11px] font-semibold text-slate-600 hover:text-vsph-core-blue disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            {hasModule("CONTACTS") && (
              <Link
                to="/v2/contacts"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-vsph-navy transition-colors"
              >
                <Sparkles size={16} /> Open contacts
              </Link>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-secondary">
            <Loader2 size={26} className="animate-spin text-vsph-core-blue mr-3" /> Loading dashboard...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {cards.map((card) => {
                const canView = !card.module || hasModule(card.module);
                const clickable = canView && !!card.path;
                return (
                  <div
                    key={card.key}
                    className={`kpi-card ${card.tone} hover:shadow-md transition-shadow duration-200 ${clickable ? "cursor-pointer" : ""}`}
                    onClick={clickable ? () => navigate(card.path) : undefined}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`kpi-card-icon ${card.tone.replace('/10', '/10').replace('bg-', 'bg-')}`}>
                        <card.icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-secondary uppercase tracking-wider">{card.label}</p>
                        <p className="text-2xl font-bold text-sidebar leading-none mt-0.5">{(card.value ?? 0).toLocaleString()}</p>
                        <p className="text-[10px] text-secondary mt-1">{card.hint}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 card border-border p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-sidebar">{personal ? "Your call volume" : "Team call volume"}</h2>
                  <span className="text-[10px] text-secondary">7 days</span>
                </div>
                {metrics.callsByDay ? (
                  <CallVolumeChart data={metrics.callsByDay} />
                ) : (
                  <p className="text-sm text-secondary">You do not have access to contacts.</p>
                )}
              </div>

              <div className="lg:col-span-4 card border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-sidebar">Pipeline</h2>
                  <span className="text-[10px] text-secondary">{totalPipeline.toLocaleString()} opportunities</span>
                </div>
                {!metrics.pipeline ? (
                  <p className="text-sm text-secondary">You do not have access to opportunities.</p>
                ) : (
                  <PipelineDonut
                    pipeline={metrics.pipeline}
                    onSelect={(stage) => navigate(`/v2/opportunities?stage=${stage || "UNASSIGNED"}`)}
                  />
                )}
              </div>

              <div className="lg:col-span-4 card border-border p-5">
                <h2 className="font-bold text-sidebar mb-4">Quick actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.filter((a) => hasModule(a.module)).map((action) => (
                    <Link
                      key={action.label}
                      to={action.path}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border text-sm text-sidebar font-medium hover:bg-vsph-grey hover:text-vsph-core-blue transition-colors ${action.color}`}
                    >
                      <action.icon size={16} />
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 card border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-sidebar inline-flex items-center gap-2">
                      <Radio size={16} className="text-emerald-500" /> {personal ? "Your activity" : "Team activity"}
                    </h2>
                    <p className="text-[11px] text-secondary mt-0.5">
                      {personal ? "Your calls, contacts and deals as they happen." : "Every call, contact and deal as it happens."}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-vsph-core-blue">LIVE</span>
                </div>

                {!metrics.recentActivity?.length ? (
                  <p className="text-sm text-secondary">No activity yet. Log a call or add a contact to see it here.</p>
                ) : (
                  <div className="space-y-3">
                    {metrics.recentActivity.map((item) => {
                      const meta = ACTIVITY_META[item.type] || ACTIVITY_META.contact;
                      const Icon = meta.icon;
                      return (
                        <div key={`${item.type}-${item.id}`} className="flex items-start gap-3">
                          <div className={`mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center ${meta.className}`}>
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0 flex-1 border-b border-border pb-3 last:border-0 last:pb-0">
                            <p className="text-sm font-semibold text-sidebar truncate">{item.title}</p>
                            <p className="text-[11px] text-secondary truncate">
                              {item.user ? `${item.user} ${meta.verb}` : label(item.type)}
                              {item.subtitle ? ` · ${item.subtitle}` : ""}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">{timeAgo(item.at)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 card border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-sidebar">{personal ? "Your recent opportunities" : "Recent opportunities"}</h2>
                  {metrics.recentOpportunities && (
                    <Link to="/v2/opportunities" className="text-[10px] font-semibold text-vsph-core-blue hover:underline inline-flex items-center gap-1">
                      View all <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
                {!metrics.recentOpportunities?.length ? (
                  <p className="text-sm text-secondary">No opportunities yet.</p>
                ) : (
                  <div className="space-y-3">
                    {metrics.recentOpportunities.map((opp) => (
                      <div key={opp.opportunity_id} className="flex items-center justify-between gap-3 border-b border-border last:border-0 pb-3 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-sidebar truncate">{opp.opportunity_name}</p>
                          <p className="text-[10px] text-secondary truncate">
                            {opp.opportunity_account?.account_name || "No account"} · {opp.opportunity_owner?.user_name || "Unassigned"}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-1 rounded bg-vsph-grey text-vsph-navy shrink-0">
                          {label(opp.opportunity_stage)}
                        </span>
                      </div>
                    ))}
                    {metrics.recentTasks?.slice(0, 3).map((task) => (
                      <div key={task.task_id} className="flex items-center justify-between gap-3 border-b border-border last:border-0 pb-3 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-sidebar truncate">{task.task_subject || "Untitled task"}</p>
                          <p className="text-[10px] text-secondary truncate">
                            {task.user?.user_name || "Unassigned"}
                            {task.task_due_date ? ` · due ${new Date(task.task_due_date).toLocaleDateString()}` : ""}
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded shrink-0 ${PRIORITY_COLORS[task.task_priority] || "bg-vsph-grey text-slate-600"}`}>
                          {label(task.task_priority)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {metrics.work && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-sidebar">
                      {metrics.work.scope === "PERSONAL" ? "My work" : "Organization work overview"}
                    </h2>
                    <p className="text-xs text-secondary">
                      {metrics.work.total} task{metrics.work.total === 1 ? "" : "s"} · average progress {metrics.work.averageProgress}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.entries(metrics.work.byStatus).map(([status, count]) => (
                      <span key={status} className={`text-[10px] font-semibold px-2 py-1 rounded border ${STATUS_COLORS[status] || STATUS_COLORS.TODO}`}>
                        {statusLabel(status)} {count}
                      </span>
                    ))}
                    {metrics.work.overdue > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded border bg-rose-50 text-rose-700 border-rose-100">
                        Overdue {metrics.work.overdue}
                      </span>
                    )}
                    {metrics.work.upcoming > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded border bg-amber-50 text-amber-700 border-amber-100">
                        Upcoming {metrics.work.upcoming}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {metrics.work.scope !== "PERSONAL" && (
                    <div className="card border-border p-5">
                      <h3 className="font-bold text-sidebar mb-4">Progress by person</h3>
                      {metrics.work.byUser.length === 0 ? (
                        <p className="text-sm text-secondary">No assigned work yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {metrics.work.byUser.map((row) => (
                            <Link
                              key={row.user_id || "unassigned"}
                              to={row.user_id ? `/v2/tasks?assigned_to=${row.user_id}` : "/v2/tasks"}
                              className="block rounded-lg border border-border px-3 py-2.5 hover:border-vsph-core-blue transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-sidebar truncate">{row.user_name}</span>
                                <span className="text-[11px] text-secondary shrink-0">
                                  {row.completed}/{row.total} done{row.overdue ? ` · ${row.overdue} overdue` : ""}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="h-1.5 flex-1 rounded-full bg-slate-200 overflow-hidden">
                                  <div className="h-full rounded-full bg-vsph-core-blue" style={{ width: `${row.averageProgress}%` }} />
                                </div>
                                <span className="text-[10px] font-semibold text-slate-600">{row.averageProgress}%</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="card border-border p-5">
                    <h3 className="font-bold text-sidebar mb-4">Recent work updates</h3>
                    {metrics.work.recentUpdates.length === 0 ? (
                      <p className="text-sm text-secondary">No work updates yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {metrics.work.recentUpdates.map((update) => (
                          <div key={update.task_update_id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                            <p className="text-sm font-semibold text-sidebar truncate">
                              {update.task?.task_subject || "Task"}
                            </p>
                            <p className="text-[11px] text-secondary">
                              {update.user?.user_name || "Unknown"} · {statusLabel(update.new_status)}
                              {update.previous_progress !== update.new_progress
                                ? ` · ${update.previous_progress ?? 0}% → ${update.new_progress ?? 0}%`
                                : ""}
                            </p>
                            {update.note && <p className="text-xs text-slate-700 mt-1 line-clamp-2">{update.note}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardV2;
