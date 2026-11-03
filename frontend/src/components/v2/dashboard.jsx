import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

const PRIORITY_COLORS = {
  HIGH: "bg-rose-50 text-rose-700",
  NORMAL: "bg-vsph-grey text-vsph-navy",
  LOW: "bg-emerald-50 text-emerald-700",
};

const label = (value) =>
  (value || "-").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const DashboardV2 = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userName = localStorage.getItem("vsph_user_name") || "there";
  const userRole = (localStorage.getItem("vsph_user_role") || "USER").replace(/_/g, " ");

  useEffect(() => {
    api
      .get("/api/dashboard/metrics")
      .then((res) => {
        if (res.success) setMetrics(res.data);
        else setError(res.message || "Could not load dashboard data.");
      })
      .catch(() => setError("Could not reach the CRM API."))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const cards = metrics
    ? [
        {
          key: "calls",
          label: "Calls today",
          value: metrics.callsToday,
          hint: "Logged by you",
          icon: Phone,
          tone: "bg-vsph-core-blue/10 text-vsph-core-blue",
        },
        {
          key: "won",
          label: "Won this month",
          value: metrics.oppsWonThisMonth,
          hint: "Closed won by you",
          icon: Trophy,
          tone: "bg-emerald-50 text-emerald-600",
        },
        metrics.accounts !== null && {
          key: "accounts",
          label: "Accounts",
          value: metrics.accounts,
          hint: "Active records",
          icon: Briefcase,
          tone: "bg-vsph-navy/10 text-vsph-navy",
        },
        metrics.contacts !== null && {
          key: "contacts",
          label: "Contacts",
          value: metrics.contacts,
          hint: "Active records",
          icon: Users,
          tone: "bg-vsph-light-blue/20 text-vsph-core-blue",
        },
        metrics.openOpportunities !== null && {
          key: "open",
          label: "Open opportunities",
          value: metrics.openOpportunities,
          hint: "In pipeline",
          icon: TrendingUp,
          tone: "bg-amber-50 text-amber-600",
        },
        metrics.myOpenTasks !== null && {
          key: "tasks",
          label: "My open tasks",
          value: metrics.myOpenTasks,
          hint: "Assigned to you",
          icon: ListChecks,
          tone: "bg-rose-50 text-rose-600",
        },
      ].filter(Boolean)
    : [];

  const totalPipeline = metrics?.pipeline?.reduce((sum, row) => sum + row.count, 0) || 0;
  const hasRecent = (metrics?.recentOpportunities?.length || 0) + (metrics?.recentTasks?.length || 0) > 0;

  return (
    <div className="min-h-full bg-vsph-grey p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-vsph-core-blue uppercase tracking-wider">{today}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-vsph-navy tracking-tight mt-1">
              Welcome back, {userName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Signed in as {userRole}. Here is your workspace at a glance.
            </p>
          </div>
          {hasModule("CONTACTS") && (
            <Link
              to="/v2/contacts"
              className="inline-flex items-center gap-2 self-start sm:self-auto h-10 px-4 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-vsph-navy transition-colors"
            >
              <Sparkles size={16} /> Open contacts
            </Link>
          )}        </div>

        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-500">
            <Loader2 size={26} className="animate-spin text-vsph-core-blue mr-3" /> Loading dashboard...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {cards.map((card) => (
                <div key={card.key} className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${card.tone}`}>
                    <card.icon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</p>
                    <p className="text-3xl font-bold text-vsph-navy leading-tight mt-1">{card.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{card.hint}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-vsph-navy">Pipeline</h2>
                  <span className="text-xs text-slate-500">{totalPipeline} opportunities</span>
                </div>

                {!metrics.pipeline ? (
                  <p className="text-sm text-slate-500">You do not have access to opportunities.</p>
                ) : metrics.pipeline.length === 0 ? (
                  <p className="text-sm text-slate-500">No opportunities yet.</p>
                ) : (
                  <div className="space-y-4">
                    {metrics.pipeline.map((row) => {
                      const percent = totalPipeline ? Math.round((row.count / totalPipeline) * 100) : 0;
                      return (
                        <div key={row.stage}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-medium text-slate-600">{label(row.stage)}</span>
                            <span className="text-slate-500">{row.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${STAGE_COLORS[row.stage] || "bg-slate-400"}`}
                              style={{ width: `${Math.max(percent, row.count ? 4 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-vsph-navy">Recent activity</h2>
                  {metrics.recentOpportunities && (
                    <Link to="/v2/opportunities" className="text-xs font-semibold text-vsph-core-blue hover:underline inline-flex items-center gap-1">
                      View all <ArrowRight size={13} />
                    </Link>
                  )}
                </div>

                {!hasRecent ? (
                  <p className="text-sm text-slate-500">No activity to show yet.</p>
                ) : (
                  <div className="space-y-4">
                    {metrics.recentOpportunities?.map((opp) => (
                      <div key={opp.opportunity_id} className="flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-vsph-navy truncate">{opp.opportunity_name}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {opp.opportunity_account?.account_name || "No account"} · {opp.opportunity_owner?.user_name || "Unassigned"}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-1 rounded bg-vsph-grey text-vsph-navy shrink-0">
                          {label(opp.opportunity_stage)}
                        </span>
                      </div>
                    ))}

                    {metrics.recentTasks?.map((task) => (
                      <div key={task.task_id} className="flex items-center justify-between gap-3 border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-vsph-navy truncate">{task.task_subject || "Untitled task"}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {task.user?.user_name || "Unassigned"}
                            {task.task_due_date ? ` · due ${new Date(task.task_due_date).toLocaleDateString()}` : ""}
                          </p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-1 rounded shrink-0 ${PRIORITY_COLORS[task.task_priority] || "bg-vsph-grey text-slate-600"}`}>
                          {label(task.task_priority)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardV2;
