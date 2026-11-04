import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus, Search, Edit2, Loader2, Trash2, Layers,
} from "lucide-react";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import { api } from "../utils/api";
import { exportCsv } from "../utils/csv";
import AddProjectModal from "../components/modals/AddProjectModal";
import ProjectDetailView from "../components/ProjectDetailView";
import { canDoAction } from "../utils/modules";
import toast from "react-hot-toast";

const Projects = () => {
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [viewProjectId, setViewProjectId] = useState(null);
  const [searchParams] = useSearchParams();
  const canCreate = canDoAction("PROJECTS", "CREATE");
  const canEdit = canDoAction("PROJECTS", "EDIT");
  const canDelete = canDoAction("PROJECTS", "DELETE");

  useEffect(() => {
    const projectId = searchParams.get("project_id");
    if (projectId) setViewProjectId(projectId);
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => fetchProjects(), 300);
    return () => clearTimeout(t);
  }, [searchTerm, currentPage]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const query = `?page=${currentPage}&limit=${limit}${
        searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
      }`;
      const response = await api.get(`/api/projects${query}`);
      if (response.success) {
        setProjectsData(response.data);
        setTotalRecords(response.pagination.totalRecords);
      }
    } catch (error) {
      console.error("Failed to fetch projects", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      setSelectedRows(projectsData.map((p) => p.project_id));
      setSelectAll(true);
    }
  };

  const toggleRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter((r) => r !== id));
      setSelectAll(false);
    } else {
      const next = [...selectedRows, id];
      setSelectedRows(next);
      if (next.length === projectsData.length) setSelectAll(true);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete project "${project.project_name || project.project_location}"?`)) return;
    const res = await api.post("/api/projects/delete", { ids: [project.project_id] });
    if (res.success) {
      toast.success("Project deleted");
      setSelectedRows([]);
      setSelectAll(false);
      fetchProjects();
    } else {
      toast.error(res.message || "Could not delete project");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedRows.length} selected project(s)?`)) return;
    const res = await api.post("/api/projects/delete", { ids: selectedRows });
    if (res.success) {
      toast.success("Projects deleted");
      setSelectedRows([]);
      setSelectAll(false);
      fetchProjects();
    } else {
      toast.error(res.message || "Could not delete projects");
    }
  };

  const statusBadge = (status) => {
    const variants = {
      ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-100",
      INACTIVE: "bg-rose-50 text-rose-700 border-rose-100",
      SUSPENDED: "bg-amber-50 text-amber-700 border-amber-100",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[status] || variants.INACTIVE}`}>
        {status ? status.replace(/_/g, " ") : "—"}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-page-bg animate-fade-in relative overflow-hidden">
      <PageHeader
        title="Projects"
        description="Manage your delivery projects and initiatives"
        exportData={{
          filename: "projects.csv",
          onExport: () =>
            exportCsv("projects.csv", projectsData, [
              { label: "Name", value: (row) => row.project_name },
              { label: "Type", value: (row) => row.project_type },
              { label: "Location", value: (row) => row.project_location },
              { label: "Date", value: (row) => row.project_date && new Date(row.project_date).toLocaleDateString() },
              { label: "Status", value: (row) => row.project_is_active },
            ]),
        }}
        primaryAction={{
          label: "New project",
          icon: <Plus size={16} />,
          onClick: () => setIsAddModalOpen(true),
        }}
      />
      <div className="px-8 py-4 border-b border-border surface flex items-center justify-between shrink-0">
        <div className="relative w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search projects&hellip;"
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {canDelete && selectedRows.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-2 font-semibold text-danger border border-rose-100 hover:bg-rose-50"
            >
              <Trash2 size={16} /> Delete selected ({selectedRows.length})
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        <div className="card flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <div className="table-container">
              <table className="table-modern" style={{ tableLayout: "fixed" }}>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className="w-10 min-w-[44px] max-w-[44px] text-center z-10">
                      {canDelete && (
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-vsph-core-blue focus:ring-vsph-core-blue cursor-pointer"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      )}
                    </th>
                    <th className="w-80 min-w-[240px]">Project Name</th>
                    <th className="w-48 min-w-[144px]">Type</th>
                    <th className="w-48 min-w-[144px]">Location</th>
                    <th className="w-48 min-w-[144px]">Date</th>
                    <th className="w-40 min-w-[128px] text-center">Status</th>
                    <th className="w-24 min-w-[96px] text-center sticky right-0 shadow-[-1px_0_0_rgba(0,0,0,0.05)] z-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="py-24 text-center text-secondary">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="animate-spin text-vsph-core-blue" size={28} />
                          <p className="text-sm font-medium">Loading projects&hellip;</p>
                        </div>
                      </td>
                    </tr>
                  ) : projectsData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-24 text-center text-secondary font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Layers size={48} className="text-slate-200 mx-auto" />
                          <p>No projects found.</p>
                          {canCreate && (
                            <button
                              onClick={() => setIsAddModalOpen(true)}
                              className="mt-3 text-xs font-semibold text-vsph-core-blue hover:underline"
                            >
                              Add your first project
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    projectsData.map((proj) => (
                      <tr
                        key={proj.project_id}
                        className={`hover:bg-vsph-light-blue/20 group cursor-pointer transition-colors ${selectedRows.includes(proj.project_id) ? "bg-vsph-light-blue/30" : ""}`}
                      >
                        <td className="border-b border-border px-6 py-4 text-center">
                          {canDelete && (
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-vsph-core-blue focus:ring-vsph-core-blue cursor-pointer"
                              checked={selectedRows.includes(proj.project_id)}
                              onChange={(e) => { e.stopPropagation(); toggleRow(proj.project_id); }}
                            />
                          )}
                        </td>
                        <td className="border-b border-border px-6 py-4 font-medium text-sidebar hover:underline cursor-pointer truncate group-hover:text-vsph-core-blue"
                          onClick={(e) => { e.stopPropagation(); setViewProjectId(proj.project_id); }}
                        >
                          {proj.project_name || "-"}
                        </td>
                        <td className="border-b border-border px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${proj.project_type === "INBOUND" ? "bg-vsph-light-blue/20 text-vsph-core-blue" : "bg-vsph-grey text-vsph-navy"}`}>
                            {proj.project_type?.replace(/_/g, " ") || "-"}
                          </span>
                        </td>
                        <td className="border-b border-border px-6 py-4 text-slate-600 truncate">
                          {proj.project_location || "-"}
                        </td>
                        <td className="border-b border-border px-6 py-4 text-slate-600 truncate">
                          {proj.project_date ? new Date(proj.project_date).toLocaleDateString() : "-"}
                        </td>
                        <td className="border-b border-border px-6 py-4 text-center">
                          {statusBadge(proj.project_is_active)}
                        </td>
                        <td className={`px-6 py-4 text-center sticky right-0 group-hover:bg-vsph-light-blue/20 shadow-[-1px_0_0_rgba(0,0,0,0.05)] ${selectedRows.includes(proj.project_id) ? "bg-vsph-light-blue/30" : "bg-surface"}`}>
                          <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <button
                                className="btn-icon"
                                title="Edit"
                                onClick={(e) => { e.stopPropagation(); setProjectToEdit(proj); setIsAddModalOpen(true); }}
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="p-2 rounded text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                title="Delete"
                                onClick={(e) => { e.stopPropagation(); handleDelete(proj); }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-8 py-4 border-t border-border surface flex items-center justify-between shrink-0">
            <span className="text-xs text-secondary font-medium">
              Showing {totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1} to{" "}
              {Math.min(currentPage * limit, totalRecords)} of {totalRecords} records
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage * limit >= totalRecords}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setProjectToEdit(null); }}
        onSuccess={fetchProjects}
        projectToEdit={projectToEdit}
      />
      {viewProjectId && (
        <ProjectDetailView
          isOpen={!!viewProjectId}
          onClose={() => setViewProjectId(null)}
          projectId={viewProjectId}
          onEdit={(proj) => { setViewProjectId(null); setProjectToEdit(proj); setIsAddModalOpen(true); }}
        />
      )}
    </div>
  );
};

export default Projects;
