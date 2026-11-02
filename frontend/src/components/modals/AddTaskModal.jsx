import React, { useState, useEffect } from "react";
import { Loader2, User } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import SearchableSelect from "../ui/SearchableSelect";
import { api } from "../../utils/api";
import toast from "react-hot-toast";

const AddTaskModal = ({ isOpen, onClose, onSuccess, taskToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [users, setUsers] = useState([]);

  const defaultFormData = {
    task_subject: "",
    task_description: "",
    task_priority: "NORMAL",
    task_due_date: "",
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        ...defaultFormData,
        task_subject: taskToEdit.task_subject || "",
        task_description: taskToEdit.task_description || "",
        task_priority: taskToEdit.task_priority || "NORMAL",
        task_due_date: taskToEdit.task_due_date
          ? new Date(taskToEdit.task_due_date).toISOString().split("T")[0]
          : "",
      });
      setOwnerId(taskToEdit.task_user_fk || "");
      setOwnerName(taskToEdit.user?.user_name || "Unknown");
    } else {
      setFormData(defaultFormData);
      setOwnerId("");
      setOwnerName("");
    }
  }, [taskToEdit]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/api/users?limit=100");
        if (res.success) {
          setUsers(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    if (isOpen) fetchUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.task_subject) {
        toast.error("Task subject is required.");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        task_user_fk: ownerId,
      };

      let response;
      if (taskToEdit) {
        response = await api.put(
          `/api/tasks/${taskToEdit.task_id}`,
          payload,
        );
      } else {
        response = await api.post("/api/tasks", payload);
      }

      if (response.success) {
        toast.success(taskToEdit ? "Task updated!" : "Task created!");
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || "Failed to save.");
        setError(response.message || "Failed to save.");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred.");
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const footerActions = (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={onClose}
        className="text-vsph-navy hover:bg-vsph-grey"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        form="add-task-form"
        variant="primary"
        disabled={loading}
        className="min-w-[120px]"
      >
        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        {loading ? "Saving..." : "Save Task"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? "Edit Task" : "Add New Task"}
      widthClass="w-[40vw]"
      footer={footerActions}
    >
      <form id="add-task-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="m-6 mb-0 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100">
            {error}
          </div>
        )}

        <div className="space-y-6 p-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-vsph-grey p-6 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-vsph-navy mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-vsph-core-blue rounded-full"></span>
              Task Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  name="task_subject"
                  required
                  value={formData.task_subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue focus-visible:border-vsph-core-blue"
                  placeholder="e.g. Follow up with client"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  name="task_description"
                  value={formData.task_description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue focus-visible:border-vsph-core-blue resize-none"
                  placeholder="Enter task description..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Priority
                  </label>
                  <select
                    name="task_priority"
                    value={formData.task_priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Due date
                  </label>
                  <input
                    type="date"
                    name="task_due_date"
                    value={formData.task_due_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Assigned to
                </label>
                <select
                  value={ownerId}
                  onChange={(e) => {
                    const user = users.find((u) => u.user_id === e.target.value);
                    if (user) {
                      setOwnerId(user.user_id);
                      setOwnerName(user.user_name);
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue"
                >
                  {!users.find((u) => u.user_id === ownerId) && (
                    <option value={ownerId}>{ownerName || "Select user"}</option>
                  )}
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.user_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;
