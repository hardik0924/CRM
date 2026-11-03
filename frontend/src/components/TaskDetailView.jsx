import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import {
  ListChecks, Users, Calendar, Edit2, MoreHorizontal, Clock, Save, History, Loader2,
} from "lucide-react";
import Button from "./ui/Button";
import AddContactModal from "./modals/AddContactModal";
import AddTaskModal from "./modals/AddTaskModal";
import { canDoAction, canManageOrganization } from "../utils/modules";
import toast from "react-hot-toast";

const PRIORITY_COLORS = {
  HIGH: "bg-rose-50 text-rose-700 border-rose-100",
  NORMAL: "bg-vsph-grey text-vsph-navy border-slate-200",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const STATUS_COLORS = {
  TODO: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-100",
  BLOCKED: "bg-amber-50 text-amber-700 border-amber-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"];
const statusLabel = (status) =>
  (status || "TODO").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const TaskDetailView = ({ isOpen, onClose, taskId, onChanged, onDeleted }) => {
  const currentUserId = localStorage.getItem("vsph_user_id");
  const canEdit = canDoAction("TASKS", "EDIT");
  const canManage = canManageOrganization();
  const canDelete = canDoAction("TASKS", "DELETE");

  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Details");
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [form, setForm] = useState({ task_status: "TODO", task_progress: 0, note: "" });
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const loadTask = () => {
    if (!taskId) return;
    setLoading(true);
    api
      .get(`/api/tasks/${taskId}`)
      .then((res) => {
        if (res.success) {
          setTaskData(res.data);
          setForm({
            task_status: res.data.task_status || "TODO",
            task_progress: res.data.task_progress || 0,
            note: "",
          });
        } else {
          setTaskData(null);
        }
      })
      .catch((error) => console.error("Error fetching task details:", error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && taskId) loadTask();
    else {
      setTaskData(null);
      setActiveTab("Details");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, taskId]);

  if (!isOpen) return null;

  const saveProgress = async (e) => {
    e.preventDefault();
    setUpdateError("");
    setSaving(true);
    try {
      const res = await api.put(`/api/tasks/${taskId}`, {
        task_status: form.task_status,
        task_progress: Number(form.task_progress),
        note: form.note,
      });
      if (!res.success) throw new Error(res.message || "Could not save the update.");
      toast.success("Work update saved");
      setForm((f) => ({ ...f, note: "" }));
      loadTask();
      onChanged?.();
    } catch (err) {
      setUpdateError(err.message || "Could not save the update.");
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async () => {
    if (!window.confirm(`Delete task "${taskData.task_subject}"?`)) return;
    const res = await api.delete(`/api/tasks/${taskId}`);
    if (res.success !== false) {
      toast.success("Task deleted");
      onDeleted?.();
      onClose();
    } else {
      toast.error(res.message || "Could not delete the task");
    }
  };

  const assignedToMe = taskData?.task_user_fk && taskData.task_user_fk === currentUserId;
  const updates = taskData?.task_updates || [];

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-50 font-sans animate-fade-in">
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : taskData ? (
          <div className="w-full mx-auto p-4 md:p-6 space-y-4">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 pb-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-blue-600 mb-1 font-semibold tracking-wide">
                    <span onClick={onClose} className="hover:underline cursor-pointer">Tasks</span> &gt; {taskData.task_subject}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                    {taskData.task_subject}
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                    {taskData.task_priority || "—"} · {taskData.task_progress || 0}% complete
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setAddContactOpen(true); }}
                    className="gap-2 font-semibold bg-blue-600 hover:bg-blue-700"
                  >
                    <Users size={16} /> New Contact
                  </Button>
                  {canManage && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setEditOpen(true)}
                      className="gap-2 font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit2 size={16} /> Edit
                    </Button>
                  )}
                  {(canManage || canDelete) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setMoreMenuOpen((open) => !open); }}
                    className="border-slate-300 px-2 relative"
                  >
                    <MoreHorizontal size={16} className="text-slate-600" />
                    {moreMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                        {canManage && (
                          <button
                            onClick={() => { setMoreMenuOpen(false); setEditOpen(true); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                          >
                            Edit Task
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => { setMoreMenuOpen(false); deleteTask(); }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            Delete Task
                          </button>
                        )}
                        {!canEdit && !canDelete && (
                          <p className="px-4 py-2 text-xs text-slate-500">No actions available.</p>
                        )}
                      </div>
                    )}
                  </Button>
                  )}
                </div>
              </div>

              {/* Highlights Panel */}
              <div className="flex flex-wrap gap-12 pt-4 pb-4 border-t border-slate-100">
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</span>
                  <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[12px] font-semibold border ${STATUS_COLORS[taskData.task_status] || STATUS_COLORS.TODO}`}>
                    {statusLabel(taskData.task_status)}
                  </span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Progress</span>
                  <span className="text-[13px] text-slate-800 font-semibold">{taskData.task_progress || 0}%</span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</span>
                  <span className={`text-[13px] font-semibold ${PRIORITY_COLORS[taskData.task_priority] || "bg-slate-300 text-slate-600"}`}>
                    {taskData.task_priority || "—"}
                  </span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Due Date</span>
                  <span className="text-[13px] text-slate-800 font-semibold">
                    {taskData.task_due_date ? new Date(taskData.task_due_date).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned To</span>
                  <span className="text-[13px] text-slate-800 font-semibold">{taskData.user?.user_name || "—"}</span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned By</span>
                  <span className="text-[13px] text-slate-800 font-semibold">{taskData.task_assigned_by?.user_name || "—"}</span>
                </div>
              </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column - Details */}
              <div className="flex-1 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                  <div className="flex border-b border-slate-200 px-4 overflow-x-auto custom-scrollbar">
                    {[
                      { id: "Details", label: "Details" },
                      { id: "Activity", label: `Activity (${updates.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "Details" && (
                    <div className="p-0">
                      <div className="border-b border-slate-200 last:border-0">
                        <div className="px-4 py-3 flex items-center gap-2 bg-slate-50">
                          <span className="text-[9px] text-slate-400">▼</span>
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Task Information</span>
                        </div>
                        <div className="p-4 pt-6 px-6 pb-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</span>
                              <span className="text-[13px] font-semibold text-slate-700">{taskData.task_subject}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                              <span className="text-[13px] font-semibold text-slate-700">{statusLabel(taskData.task_status)}</span>
                            </div>
                            <div className="flex flex-col md:col-span-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</span>
                              <span className="text-[13px] text-slate-700 whitespace-pre-wrap">{taskData.task_description || "—"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start date</span>
                              <span className="text-[13px] text-slate-700">
                                {taskData.task_start_date ? new Date(taskData.task_start_date).toLocaleDateString() : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due date</span>
                              <span className="text-[13px] text-slate-700">
                                {taskData.task_due_date ? new Date(taskData.task_due_date).toLocaleDateString() : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</span>
                              <span className="text-[13px] text-slate-700">
                                {taskData.task_completed_at ? new Date(taskData.task_completed_at).toLocaleString("en-GB") : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created</span>
                              <span className="text-[13px] text-slate-700">
                                {taskData.task_created_at ? new Date(taskData.task_created_at).toLocaleString("en-GB") : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "Activity" && (
                    <div className="p-5">
                      {updates.length === 0 ? (
                        <p className="text-sm text-slate-500">No work updates recorded yet.</p>
                      ) : (
                        <div className="space-y-4">
                          {updates.map((update) => (
                            <div key={update.task_update_id} className="flex gap-3 border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                              <div className="w-8 h-8 rounded-full border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 bg-white">
                                <History size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-slate-800">
                                  {update.user?.user_name || "Unknown"}
                                  {update.previous_status !== update.new_status && (
                                    <span className="text-slate-500 font-normal"> moved {statusLabel(update.previous_status)} → {statusLabel(update.new_status)}</span>
                                  )}
                                </p>
                                {update.previous_progress !== update.new_progress && (
                                  <p className="text-[11px] text-slate-500">
                                    Progress {update.previous_progress ?? 0}% → {update.new_progress ?? 0}%
                                  </p>
                                )}
                                {update.note && <p className="text-[13px] text-slate-700 mt-1 whitespace-pre-wrap">{update.note}</p>}
                                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                                  <Clock size={11} /> {new Date(update.created_at).toLocaleString("en-GB")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Progress update */}
              <div className="lg:w-[340px] flex-shrink-0 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                    <ListChecks size={14} className="text-blue-600" /> WORK UPDATE
                  </div>
                  {canEdit ? (
                    <form onSubmit={saveProgress} className="p-4 space-y-4">
                      {updateError && (
                        <div className="p-2.5 rounded bg-rose-50 border border-rose-100 text-xs text-rose-700">{updateError}</div>
                      )}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Status</label>
                        <select
                          value={form.task_status}
                          onChange={(e) => setForm({ ...form, task_status: e.target.value })}
                          className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-blue-400"
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>{statusLabel(status)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Progress · {form.task_progress}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={form.task_progress}
                          onChange={(e) => setForm({ ...form, task_progress: e.target.value })}
                          className="w-full accent-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Work note</label>
                        <textarea
                          rows={4}
                          value={form.note}
                          onChange={(e) => setForm({ ...form, note: e.target.value })}
                          placeholder="What did you complete? Any blockers?"
                          className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 resize-none"
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={saving}
                        className="w-full gap-2 font-bold justify-center bg-blue-600 py-2.5 disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? "Saving..." : "Save update"}
                      </Button>
                      {!assignedToMe && (
                        <p className="text-[11px] text-slate-500">
                          You are updating this task as an administrator.
                        </p>
                      )}
                    </form>
                  ) : (
                    <p className="p-4 text-sm text-slate-500">
                      You have view-only access to tasks. Ask your organization administrator for edit access.
                    </p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                    <Calendar size={14} className="text-slate-500" /> TASK INFO
                  </div>
                  <div className="p-4 text-xs space-y-3 font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Priority</span>
                      <span className="text-slate-800">{taskData.task_priority || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Assigned To</span>
                      <span className="text-slate-800">{taskData.user?.user_name || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Due Date</span>
                      <span className="text-slate-800">{taskData.task_due_date ? new Date(taskData.task_due_date).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Status</span>
                      <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${STATUS_COLORS[taskData.task_status] || STATUS_COLORS.TODO}`}>
                        {statusLabel(taskData.task_status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full text-slate-500 font-semibold">
            Task not found.
          </div>
        )}
      </div>

      {addContactOpen && (
        <AddContactModal
          isOpen={addContactOpen}
          onClose={() => setAddContactOpen(false)}
          onSuccess={() => setAddContactOpen(false)}
          contactToEdit={null}
        />
      )}

      {editOpen && (
        <AddTaskModal
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => { loadTask(); onChanged?.(); }}
          taskToEdit={taskData}
        />
      )}
    </div>
  );
};

export default TaskDetailView;
