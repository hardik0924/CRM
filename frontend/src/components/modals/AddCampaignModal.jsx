import React, { useState, useEffect } from "react";
import { Loader2, User } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import SearchableSelect from "../ui/SearchableSelect";
import { api } from "../../utils/api";
import toast from "react-hot-toast";

const AddCampaignModal = ({ isOpen, onClose, onSuccess, campaignToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [users, setUsers] = useState([]);

  const defaultFormData = {
    campaign_name: "",
  };

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (campaignToEdit) {
      setFormData({
        ...defaultFormData,
        campaign_name: campaignToEdit.campaign_name || "",
      });
      setOwnerId(campaignToEdit.campaign_user_fk || "");
      setOwnerName(campaignToEdit.user?.user_name || "Unknown");
    } else {
      setFormData(defaultFormData);
      setOwnerId("");
      setOwnerName("");
    }
  }, [campaignToEdit]);

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
      if (!formData.campaign_name) {
        toast.error("Campaign name is required.");
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        campaign_user_fk: ownerId,
      };

      let response;
      if (campaignToEdit) {
        response = await api.put(
          `/api/campaigns/${campaignToEdit.campaign_id}`,
          payload,
        );
      } else {
        response = await api.post("/api/campaigns", payload);
      }

      if (response.success) {
        toast.success(
          campaignToEdit ? "Campaign updated!" : "Campaign created!",
        );
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
        form="add-campaign-form"
        variant="primary"
        disabled={loading}
        className="min-w-[120px]"
      >
        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        {loading ? "Saving..." : "Save Campaign"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={campaignToEdit ? "Edit Campaign" : "Add New Campaign"}
      widthClass="w-[40vw]"
      footer={footerActions}
    >
      <form id="add-campaign-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="m-6 mb-0 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-100">
            {error}
          </div>
        )}

        <div className="space-y-6 p-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-vsph-grey p-6 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-vsph-navy mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-vsph-core-blue rounded-full"></span>
              Campaign Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Campaign name *
                </label>
                <input
                  type="text"
                  name="campaign_name"
                  required
                  value={formData.campaign_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vsph-core-blue focus-visible:border-vsph-core-blue"
                  placeholder="e.g. Q3 Product Launch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Owner
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
                    <option value={ownerId}>{ownerName || "Select owner"}</option>
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

export default AddCampaignModal;
