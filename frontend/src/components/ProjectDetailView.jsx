import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { Layers, Users, Calendar, Edit2, MoreHorizontal } from "lucide-react";
import Button from "./ui/Button";
import AddTaskModal from "./modals/AddTaskModal";
import ActivityFeed from "./ActivityFeed";
import Breadcrumbs from "./ui/Breadcrumbs";
import { canDoAction } from "../utils/modules";

const ProjectDetailView = ({ isOpen, onClose, projectId, onEdit }) => {
  const canCreateTask = canDoAction("TASKS", "CREATE");
  const canEdit = canDoAction("PROJECTS", "EDIT");
  const canDelete = canDoAction("PROJECTS", "DELETE");
  const [projData, setProjData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Details");
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      api
        .get(`/api/projects/${projectId}`)
        .then((res) => {
          if (res.success) setProjData(res.data);
        })
        .catch((error) => console.error("Error fetching project details:", error))
        .finally(() => setLoading(false));
    } else {
      setProjData(null);
      setActiveTab("Details");
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-50 font-sans animate-fade-in">
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : projData ? (
          <div className="w-full mx-auto p-4 md:p-6 space-y-4">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 pb-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Breadcrumbs
                    items={[
                      { label: "Projects", path: "/v2/projects" },
                      { label: projData.project_name || "Project", current: true },
                    ]}
                  />
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                    {projData.project_name}
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                    {projData.project_is_active || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canCreateTask && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => { setAddTaskOpen(true); }}
                      className="gap-2 font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                      <Users size={16} /> New Task
                    </Button>
                  )}
                  {(canEdit || canDelete) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setMoreMenuOpen(true); }}
                    className="border-slate-300 px-2 relative"
                  >
                    <MoreHorizontal size={16} className="text-slate-600" />
                    {moreMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                        {canEdit && (
                          <button
                            onClick={() => { setMoreMenuOpen(false); onEdit?.(projData); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                          >
                            Edit Project
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete project "${projData.project_name}"?`)) {
                                api.post("/api/projects/delete", { ids: [projectId] }).then((res) => {
                                  if (res.success) {
                                    onClose();
                                  }
                                });
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            Delete Project
                          </button>
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</span>
                  <span className="text-[13px] text-slate-800 font-semibold">{projData.project_location || "—"}</span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Type</span>
                  <span className="text-[13px] text-slate-800 font-semibold">{projData.project_type || "—"}</span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</span>
                  <span className="text-[13px] text-slate-800 font-semibold">
                    {projData.project_date ? new Date(projData.project_date).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</span>
                  <span className={projData.project_is_active === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}>
                    {projData.project_is_active || "—"}
                  </span>
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
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Project Information</span>
                        </button>
                        <div className="p-4 pt-6 px-6 pb-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Name</span>
                              <span className="text-[13px] font-semibold text-slate-700">{projData.project_name}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</span>
                              <span className="text-[13px] text-slate-700">{projData.project_type || "—"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Location</span>
                              <span className="text-[13px] text-slate-700">{projData.project_location || "—"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</span>
                              <span className="text-[13px] text-slate-700">
                                {projData.project_date ? new Date(projData.project_date).toLocaleDateString() : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</span>
                              <span className={projData.project_is_active === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}>
                                {projData.project_is_active || "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created</span>
                              <span className="text-[13px] text-slate-700">
                                {projData.project_created_at ? new Date(projData.project_created_at).toLocaleString("en-GB") : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === "Activity" && <ActivityFeed entity="project" id={projectId} />}
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:w-[320px] flex-shrink-0 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                    <Layers size={14} className="text-[#0066cc]" /> PROJECT INFO
                  </div>
                  <div className="p-4 text-xs space-y-3 font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Type</span>
                      <span className="text-slate-800">{projData.project_type || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Location</span>
                      <span className="text-slate-800">{projData.project_location || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Date</span>
                      <span className="text-slate-800">{projData.project_date ? new Date(projData.project_date).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Status</span>
                      <span className={projData.project_is_active === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}>
                        {projData.project_is_active || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full text-slate-500 font-semibold">
            Project not found.
          </div>
        )}
      </div>

      {addTaskOpen && (
        <AddTaskModal
          isOpen={addTaskOpen}
          onClose={() => setAddTaskOpen(false)}
          onSuccess={() => setAddTaskOpen(false)}
          taskToEdit={null}
        />
      )}
    </div>
  );
};

export default ProjectDetailView;
