import React, { useState, useEffect } from "react";
import { Loader2, Plus, User } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import SearchableSelect from "../ui/SearchableSelect";
import { api } from "../../utils/api";
import toast from "react-hot-toast";

const AddProjectModal = ({ isOpen, onClose, onSuccess, projectToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projectEnums, setProjectEnums] = useState({ types: [], statuses: [] });
  const [fieldErrors, setFieldErrors] = useState({});

  const defaultFormData = {
    project_name: "",
    project_location: "",
    project_date: "",
    project_type: "",
    project_is_active: "ACTIVE",
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (projectToEdit) {
      const formattedDate = (isoString) =>
        isoString ? new Date(isoString).toISOString().split("T")[0] : "";

      setFormData({
        ...defaultFormData,
        ...projectToEdit,
        project_date: formattedDate(projectToEdit.project_date),
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [projectToEdit, isOpen]);

  useEffect(() => {
    const fetchEnums = async () => {
      try {
        const response = await api.get("/api/projects/enums");
        if (response.success) {
          setProjectEnums(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch project enums:", err);
      }
    };

    if (isOpen) {
      fetchEnums();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      setFieldErrors({});
      const newErrors = {};

      if (!formData.project_location) newErrors.project_location = true;

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(newErrors);
        if (newErrors.project_location) {
          toast.error("Location is required.");
        }
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        project_date: formData.project_date
          ? new Date(formData.project_date).toISOString()
          : null,
      };

      let response;
      if (projectToEdit) {
        response = await api.put(
          `/api/projects/${projectToEdit.project_id}`,
          payload,
        );
      } else {
        response = await api.post("/api/projects", payload);
      }

      if (response.success) {
        toast.success(
          projectToEdit
            ? "Project updated successfully!"
            : "Project created successfully!",
        );
        document.body.style.overflow = "hidden";
        setFieldErrors({});
        onSuccess();
        onClose();
      } else {
        toast.error(
          response.message ||
            (projectToEdit
              ? "Failed to update project"
              : "Failed to create project"),
        );
        setError(response.message || "Failed to create project");
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
        form="add-project-form"
        variant="primary"
        disabled={loading}
        className="min-w-[120px]"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>{projectToEdit ? "Save Changes" : "Save Project"}</span>
          </div>
        )}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? "Edit Project" : "Add New Project"}
      widthClass="w-[40vw]"
      footer={footerActions}
    >
      <form id="add-project-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="m-6 mb-0 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-6 p-6 max-h-[70vh] overflow-y-auto">
          {/* Section 1: Core Details */}
          <div className="bg-vsph-grey p-5 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-vsph-core-blue rounded-full"></span>
              Core Details
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue text-sm"
                    placeholder="e.g. Q3 Launch"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="project_location"
                    value={formData.project_location}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm ${
                      fieldErrors.project_location
                        ? "border-red-500 focus:ring-red-500/20"
                        : "border-border focus:ring-vsph-core-blue focus:border-vsph-core-blue"
                    }`}
                    placeholder="e.g. New York, NY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Project Date
                  </label>
                  <input
                    type="date"
                    name="project_date"
                    value={formData.project_date}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Status
                  </label>
                  <SearchableSelect
                    options={projectEnums.statuses.map(s => s.replace(/_/g, " "))}
                    value={formData.project_is_active?.replace(/_/g, " ")}
                    onChange={(val) => {
                      const originalValue = projectEnums.statuses.find(s => s.replace(/_/g, " ") === val) || val;
                      setFormData({ ...formData, project_is_active: originalValue });
                    }}
                    placeholder="Select Status"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Type
                  </label>
                  <SearchableSelect
                    options={projectEnums.types.map(t => t.replace(/_/g, " "))}
                    value={formData.project_type?.replace(/_/g, " ")}
                    onChange={(val) => {
                      const originalValue = projectEnums.types.find(t => t.replace(/_/g, " ") === val) || val;
                      setFormData({ ...formData, project_type: originalValue });
                    }}
                    placeholder="Select Type"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddProjectModal;
