import React, { useEffect, useState } from "react";
import { Phone, ListChecks, Loader2 } from "lucide-react";
import { api } from "../utils/api";

const TASK_STATUS = {
  TODO: { label: "To do", className: "bg-slate-100 text-slate-600 border-slate-200" },
  IN_PROGRESS: { label: "In progress", className: "bg-blue-50 text-blue-700 border-blue-100" },
  BLOCKED: { label: "Blocked", className: "bg-amber-50 text-amber-700 border-amber-100" },
  COMPLETED: { label: "Completed", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
};

const ActivityFeed = ({ entity, id }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    api
      .get(`/api/activity?entity=${entity}&id=${id}`)
      .then((res) => {
        if (cancelled) return;
        if (res.success) setItems(res.data || []);
        else setError(res.message || "Could not load activity.");
      })
      .catch(() => !cancelled && setError("Could not load activity."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [entity, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading activity...
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-sm font-semibold text-rose-600">{error}</div>;
  }

  if (!items.length) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-semibold text-slate-600">No activity yet</p>
        <p className="mt-1 text-xs text-slate-400">
          Calls and tasks logged for the linked contacts appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {items.map((item) => {
        const isTask = item.type === "task";
        const status = isTask ? TASK_STATUS[item.status] || TASK_STATUS.TODO : null;
        const Icon = isTask ? ListChecks : Phone;
        return (
          <div key={`${item.type}-${item.id}`} className="flex gap-3 px-4 py-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-blue-50 text-blue-600">
              <Icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-slate-800">{item.title}</span>
                {status && (
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.description}</p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">
                {item.contact && <span className="font-medium text-slate-500">{item.contact}</span>}
                {item.contact && " · "}
                {isTask ? "Task" : "Call"}
                {item.user && ` by ${item.user}`}
                {" · "}
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
