import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { ListChecks, Users, Calendar, Edit2, MoreHorizontal, Clock } from "lucide-react";
import Button from "./ui/Button";

const PRIORITY_COLORS = {
  HIGH: "bg-rose-50 text-rose-700 border-rose-100",
  NORMAL: "bg-vsph-grey text-vsph-navy border-slate-200",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const TaskDetailView = ({ isOpen, onClose, taskId }) => {
  const [taskData, setTaskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Details");

  useEffect(() => {
    if (isOpen && taskId) {
      setLoading(true);
      api
        .get(`/api/tasks/${taskId}`)
        .then((res) => {
          if (res.success) setTaskData(res.data);
        })
        .catch((error) => console.error("Error fetching task details:", error))
        .finally(() => setLoading(false));
    } else {
      setTaskData(null);
      setActiveTab("Details");
    }
  }, [isOpen, taskId]);

  if (!isOpen) return null;

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
                    {taskData.task_priority || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" className="gap-2 text-blue-600 font-semibold border-slate-300">
                    <Users size={16} /> New Contact
                  </Button>
                  <Button variant="secondary" size="sm" className="border-slate-300 px-2">
                    <MoreHorizontal size={16} className="text-slate-600" />
                  </Button>
                </div>
              </div>

              {/* Highlights Panel */}
              <div className="flex flex-wrap gap-12 pt-4 pb-4 border-t border-slate-100">
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</span>
                  <span className="text-[13px] text-slate-800 font-semibold">Open</span>
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
                      { id: "Activity", label: "Activity" },
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
                        <button className="w-full px-4 py-3 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors group">
                          <span className="text-[9px] transform transition-transform group-hover:text-blue-600 text-slate-400">▼</span>
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Task Information</span>
                        </button>
                        <div className="p-4 pt-6 px-6 pb-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subject</span>
                              <span className="text-[13px] font-semibold text-slate-700">{taskData.task_subject}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</span>
                              <span className={`text-[13px] font-semibold ${PRIORITY_COLORS[taskData.task_priority] || "bg-slate-300 text-slate-600"}`}>
                                {taskData.task_priority || "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</span>
                              <span className="text-[13px] text-slate-700">
                                {taskData.task_due_date ? new Date(taskData.task_due_date).toLocaleDateString() : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assigned To</span>
                              <span className="text-[13px] text-slate-700">{taskData.user?.user_name || "—"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</span>
                              <span className="text-[13px] text-slate-700">{taskData.task_description || "—"}</span>
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
                  {activeTab !== "Details" && (
                    <div className="p-8 text-center text-sm font-semibold text-slate-500">{activeTab} content will go here.</div>
                  )}
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:w-[320px] flex-shrink-0 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                    <ListChecks size={14} className="text-[#0066cc]" /> TASK INFO
                  </div>
                  <div className="p-4 text-xs space-y-3 font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Priority</span>
                      <span className={`text-slate-800 ${PRIORITY_COLORS[taskData.task_priority] || "bg-slate-300 text-slate-600"}`}>
                        {taskData.task_priority || "—"}
                      </span>
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
                      <span className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[13px] font-semibold">Open</span>
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
    </div>
  );
};

export default TaskDetailView;
