import { useState, useEffect } from "react";
import {
  Download, Plus, Search, Edit2, Loader2, Trash2, ListChecks,
} from "lucide-react";
import Button from "../components/ui/Button";
import { api } from "../utils/api";
import { exportCsv } from "../utils/csv";
import AddTaskModal from "../components/modals/AddTaskModal";
import toast from "react-hot-toast";

const PRIORITY_COLORS = {
  HIGH: "bg-rose-50 text-rose-700 border-rose-100",
  NORMAL: "bg-vsph-grey text-vsph-navy border-slate-200",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const Tasks = () => {
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [tasksData, setTasksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => fetchTasks(), 300);
    return () => clearTimeout(t);
  }, [searchTerm, currentPage]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const query = `?page=${currentPage}&limit=${limit}${
        searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
      }`;
      const response = await api.get(`/api/tasks${query}`);
      if (response.success) {
        setTasksData(response.data);
        setTotalRecords(response.pagination.totalRecords || response.data.length);
      }
    } catch (error) {
      console.error("Failed to fetch tasks", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      setSelectedRows(tasksData.map((t) => t.task_id));
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
      if (next.length === tasksData.length) setSelectAll(true);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete task "${task.task_subject || "Untitled"}"?`)) return;
    const res = await api.delete(`/api/tasks/${task.task_id}`);
    if (res.success !== false) {
      toast.success("Task deleted");
      setSelectedRows([]);
      setSelectAll(false);
      fetchTasks();
    } else {
      toast.error(res.message || "Could not delete task");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedRows.length} selected task(s)?`)) return;
    const results = await Promise.all(selectedRows.map((id) => api.delete(`/api/tasks/${id}`)));
    if (results.every((res) => res.success)) {
      toast.success("Tasks deleted");
      setSelectedRows([]);
      setSelectAll(false);
      fetchTasks();
    } else {
      toast.error("Some tasks could not be deleted");
      fetchTasks();
    }
  };

  return (
    <div className="flex flex-col h-full bg-vsph-grey animate-fade-in relative overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 shrink-0 z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-vsph-navy text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Manage your to-dos and follow-ups
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportCsv("tasks.csv", tasksData, [
              { label: "Subject", value: (row) => row.task_subject },
              { label: "Priority", value: (row) => row.task_priority },
              { label: "Due date", value: (row) => row.task_due_date && new Date(row.task_due_date).toLocaleDateString() },
              { label: "Assigned to", value: (row) => row.user?.user_name },
            ])}
            className="gap-2 font-medium text-slate-600 border border-slate-200"
          >
            <Download size={16} className="text-slate-500" /> Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 font-semibold"
          >
            <Plus size={16} /> New task
          </Button>
        </div>
      </div>

      <div className="px-8 py-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="relative w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search tasks&hellip;"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {selectedRows.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-2 font-semibold text-rose-600 border border-rose-200 hover:bg-rose-50"
            >
              <Trash2 size={16} /> Delete selected ({selectedRows.length})
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        <div className="card flex-1 flex flex-col overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm border-collapse" style={{ tableLayout: "fixed" }}>
              <thead className="sticky top-0 z-10 bg-vsph-grey shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr>
                  <th className="border-b border-slate-200 px-6 py-3 bg-vsph-grey w-10 min-w-[44px] max-w-[44px] text-center z-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-vsph-core-blue focus:ring-vsph-core-blue cursor-pointer"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="border-b border-slate-200 px-6 py-3 bg-vsph-grey w-80 min-w-[240px]">Subject</th>
                  <th className="border-b border-slate-200 px-6 py-3 bg-vsph-grey w-40 min-w-[120px]">Priority</th>
                  <th className="border-b border-slate-200 px-6 py-3 bg-vsph-grey w-48 min-w-[144px]">Due Date</th>
                  <th className="border-b border-slate-200 px-6 py-3 bg-vsph-grey w-48 min-w-[144px]">Assigned to</th>
                  <th className="border-b border-slate-200 px-6 py-3 bg-vsph-grey w-24 min-w-[96px] text-center sticky right-0 shadow-[-1px_0_0_rgba(0,0,0,0.05)] z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-24 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-vsph-core-blue" size={28} />
                        <p className="text-sm font-medium">Loading tasks&hellip;</p>
                      </div>
                    </td>
                  </tr>
                ) : tasksData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-24 text-center text-slate-500 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ListChecks size={48} className="text-slate-200 mx-auto" />
                        <p>No tasks found.</p>
                        <button
                          onClick={() => setIsAddModalOpen(true)}
                          className="mt-3 text-xs font-semibold text-vsph-core-blue hover:underline"
                        >
                          Add your first task
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tasksData.map((task) => (
                    <tr
                      key={task.task_id}
                      className={`hover:bg-vsph-light-blue/20 group cursor-pointer transition-colors ${selectedRows.includes(task.task_id) ? "bg-vsph-light-blue/30" : ""}`}
                    >
                      <td className="border-b border-slate-100 px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-vsph-core-blue focus:ring-vsph-core-blue cursor-pointer"
                          checked={selectedRows.includes(task.task_id)}
                          onChange={(e) => { e.stopPropagation(); toggleRow(task.task_id); }}
                        />
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 font-medium text-vsph-navy hover:underline cursor-pointer truncate group-hover:text-vsph-core-blue">
                        {task.task_subject || "-"}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4">
                        {task.task_priority ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[task.task_priority] || "bg-vsph-grey text-slate-600"}`}>
                            {task.task_priority?.replace(/_/g, " ") || "-"}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-slate-600 truncate">
                        {task.task_due_date ? new Date(task.task_due_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-slate-600 truncate">
                        {task.user?.user_name || "-"}
                      </td>
                      <td className={`px-6 py-4 text-center sticky right-0 group-hover:bg-vsph-light-blue/20 shadow-[-1px_0_0_rgba(0,0,0,0.05)] ${selectedRows.includes(task.task_id) ? "bg-vsph-light-blue/30" : "bg-white"}`}>
                        <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 bg-vsph-grey hover:bg-vsph-light-blue/30 rounded text-slate-500 hover:text-vsph-core-blue transition-colors"
                            title="Edit"
                            onClick={(e) => { e.stopPropagation(); setTaskToEdit(task); setIsAddModalOpen(true); }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-2 bg-rose-50 hover:bg-rose-100 rounded text-rose-500 hover:text-rose-600 transition-colors"
                            title="Delete"
                            onClick={(e) => { e.stopPropagation(); handleDelete(task); }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-8 py-4 border-t border-slate-200 flex items-center justify-between bg-vsph-grey shrink-0">
            <span className="text-xs text-slate-500 font-medium">
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

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setTaskToEdit(null); }}
        onSuccess={fetchTasks}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};

export default Tasks;
