import React, { useState, useEffect } from "react";
import { Loader2, User } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import SearchableSelect from "../ui/SearchableSelect";
import { api } from "../../utils/api";
import toast from "react-hot-toast";

const AddOpportunityModal = ({
  isOpen,
  onClose,
  onSuccess,
  opportunityToEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");

  // Dynamic relations
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  const [formData, setFormData] = useState({
    opportunity_name: "",
    opportunity_close_date: "",
    opportunity_stage: "PITCH_DONE",
    opportunity_type: "INBOUND",
    opportunity_account_fk: "",
    opportunity_contact_fk: "",
    opportunity_project_id: "",
    opportunity_campaign_id: "",
    opportunity_call_status: "",
    opportunity_engagement_form: "",
    opportunity_payment_status: "",
    opportunity_loss_reason: "",
    opportunity_pitched_at: "",
    opportunity_pickup_date: "",
    opportunity_pickup_time: "",
    opportunity_pickup_location: "",
    opportunity_drop_date: "",
    opportunity_drop_time: "",
    opportunity_drop_location: "",
  });

  // Fetch relations when modal opens
  useEffect(() => {
    const fetchRelations = async () => {
      try {
        const [usersRes, accountsRes, contactsRes, projectsRes] = await Promise.all([
          api.get("/api/users"),
          api.get("/api/accounts?limit=100"),
          api.get("/api/contacts?limit=100"),
          api.get("/api/projects?limit=100"),
        ]);

        if (accountsRes.success) {
          setAccounts(
            accountsRes.data.map((acc) => ({
              id: acc.account_id,
              name: acc.account_name,
            })),
          );
        }
        if (contactsRes.success) {
          setContacts(
            contactsRes.data.map((c) => ({
              id: c.contact_id,
              name: `${c.contact_firstname} ${c.contact_lastname}`.trim(),
            })),
          );
        }
        if (usersRes && usersRes.success) {
          setUsers(
            usersRes.data.map((u) => ({
              id: u.user_id,
              name: u.user_name,
            }))
          );
        }
        if (projectsRes && projectsRes.success) {
          setProjects(
            projectsRes.data.map((p) => ({
              id: p.project_id,
              name: p.project_name || `Project (${p.project_location})`,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch relations", error);
      }
    };
    if (isOpen) fetchRelations();
  }, [isOpen]);


  // Pre-fill form if editing
  useEffect(() => {
    if (opportunityToEdit) {
      setFormData({
        opportunity_name: opportunityToEdit.opportunity_name || "",
        opportunity_close_date: opportunityToEdit.opportunity_close_date
          ? new Date(opportunityToEdit.opportunity_close_date)
              .toISOString()
              .split("T")[0]
          : "",
        opportunity_stage: opportunityToEdit.opportunity_stage || "PITCH_DONE",
        opportunity_type: opportunityToEdit.opportunity_type || "INBOUND",
        opportunity_account_fk: opportunityToEdit.opportunity_account_fk || "",
        opportunity_contact_fk: opportunityToEdit.opportunity_contact_fk || "",
        opportunity_project_id: opportunityToEdit.opportunity_project_id || "",
        opportunity_campaign_id:
          opportunityToEdit.opportunity_campaign_id || "",
        opportunity_call_status:
          opportunityToEdit.opportunity_call_status || "",
        opportunity_engagement_form:
          opportunityToEdit.opportunity_engagement_form || "",
        opportunity_payment_status:
          opportunityToEdit.opportunity_payment_status || "",
        opportunity_loss_reason:
          opportunityToEdit.opportunity_loss_reason || "",
        opportunity_pitched_at: opportunityToEdit.opportunity_pitched_at
          ? new Date(opportunityToEdit.opportunity_pitched_at)
              .toISOString()
              .split("T")[0]
          : "",
        opportunity_pickup_date: opportunityToEdit.opportunity_pickup_date
          ? new Date(opportunityToEdit.opportunity_pickup_date)
              .toISOString()
              .split("T")[0]
          : "",
        opportunity_pickup_time:
          opportunityToEdit.opportunity_pickup_time || "",
        opportunity_pickup_location:
          opportunityToEdit.opportunity_pickup_location || "",
        opportunity_drop_date: opportunityToEdit.opportunity_drop_date
          ? new Date(opportunityToEdit.opportunity_drop_date)
              .toISOString()
              .split("T")[0]
          : "",
        opportunity_drop_time: opportunityToEdit.opportunity_drop_time || "",
        opportunity_drop_location:
          opportunityToEdit.opportunity_drop_location || "",
      });
      setOwnerId(opportunityToEdit.opportunity_owner_fk);
      setOwnerName(opportunityToEdit.opportunity_owner?.user_name || "Unknown");
    } else {
      setFormData({
        opportunity_name: "",
        opportunity_close_date: "",
        opportunity_stage: "",
        opportunity_type: "",
        opportunity_account_fk: "",
        opportunity_contact_fk: "",
        opportunity_project_id: "",
        opportunity_campaign_id: "",
        opportunity_call_status: "",
        opportunity_engagement_form: "",
        opportunity_payment_status: "",
        opportunity_loss_reason: "",
        opportunity_pitched_at: "",
        opportunity_pickup_date: "",
        opportunity_pickup_time: "",
        opportunity_pickup_location: "",
        opportunity_drop_date: "",
        opportunity_drop_time: "",
        opportunity_drop_location: "",
      });

      if (isOpen) {
        const userId = localStorage.getItem("vsph_user_id");
        const userName = localStorage.getItem("vsph_user_name");
        if (userId) {
          setOwnerName(userName || "Unknown User");
          setOwnerId(userId);
        }
      }
    }
  }, [opportunityToEdit, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.opportunity_name || !formData.opportunity_close_date) {
      toast.error("Name and Close Date are required.");
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData, opportunity_owner_fk: ownerId };

      let response;
      if (opportunityToEdit) {
        response = await api.put(
          `/api/opportunities/${opportunityToEdit.opportunity_id}`,
          payload,
        );
      } else {
        response = await api.post("/api/opportunities", payload);
      }

      if (response.success) {
        toast.success(
          opportunityToEdit ? "Opportunity updated!" : "Opportunity created!",
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

  const headerActions = (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="bg-blue-100 p-1 rounded-full text-blue-600">
        <User size={14} />
      </div>
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
        Owner:
      </span>
      <select
        value={ownerId}
        onChange={(e) => {
          const user = users.find((u) => u.id === e.target.value);
          if (user) {
            setOwnerId(user.id);
            setOwnerName(user.name);
          }
        }}
        className="text-sm font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0 cursor-pointer outline-none truncate max-w-[150px]"
      >
        {!users.find((u) => u.id === ownerId) && (
          <option value={ownerId}>{ownerName}</option>
        )}
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );

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
        form="add-opp-form"
        variant="primary"
        disabled={loading}
        className="min-w-[120px]"
      >
        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        {loading ? "Saving..." : "Save Opportunity"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={opportunityToEdit ? "Edit Opportunity" : "Add New Opportunity"}
      widthClass="w-[50vw]"
      headerActions={headerActions}
      footer={footerActions}
    >
      <form id="add-opp-form" onSubmit={handleSubmit} noValidate>
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
                    Opportunity Name *
                  </label>
                  <input
                    type="text"
                    name="opportunity_name"
                    value={formData.opportunity_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="e.g. New Software Deal"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Close Date *
                  </label>
                  <input
                    type="date"
                    name="opportunity_close_date"
                    value={formData.opportunity_close_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Stage
                  </label>
                  <SearchableSelect
                    options={[
                      "PITCH_DONE",
                      "FOLLOW_UP",
                      "CONTRACT_OUT",
                      "CLOSED_WON",
                      "CLOSED_LOST"
                    ].map((stage) => stage.replace(/_/g, " "))}
                    value={formData.opportunity_stage?.replace(/_/g, " ")}
                    onChange={(val) => {
                      const options = [
                        "PITCH_DONE",
                        "FOLLOW_UP",
                        "CONTRACT_OUT",
                        "CLOSED_WON",
                        "CLOSED_LOST"
                      ];
                      const originalValue =
                        options.find((s) => s.replace(/_/g, " ") === val) || val;
                      setFormData({
                        ...formData,
                        opportunity_stage: originalValue,
                      });
                    }}
                    placeholder="Select Stage"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Type
                  </label>
                  <SearchableSelect
                    options={["INBOUND", "OUTBOUND"]}
                    value={formData.opportunity_type}
                    onChange={(val) =>
                      setFormData({ ...formData, opportunity_type: val })
                    }
                    placeholder="Select Type"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Call Status
                  </label>
                  <SearchableSelect
                    options={[
                      "RINGING",
                      "PITCH_DONE",
                      "NOT_INTERESTED",
                      "NOT_RELEVANT",
                      "LEFT_ORGANIZATION",
                      "NOT_AVAILABLE",
                      "CONNECTED",
                      "NOT_CONNECTED",
                      "WRONG_NUMBER",
                      "DNC",
                    ].map((s) => s.replace(/_/g, " "))}
                    value={formData.opportunity_call_status?.replace(/_/g, " ")}
                    onChange={(val) => {
                      const options = [
                        "RINGING",
                        "PITCH_DONE",
                        "NOT_INTERESTED",
                        "NOT_RELEVANT",
                        "LEFT_ORGANIZATION",
                        "NOT_AVAILABLE",
                        "CONNECTED",
                        "NOT_CONNECTED",
                        "WRONG_NUMBER",
                        "DNC",
                      ];
                      const originalValue =
                        options.find((s) => s.replace(/_/g, " ") === val) ||
                        val;
                      setFormData({
                        ...formData,
                        opportunity_call_status: originalValue,
                      });
                    }}
                    placeholder="Select Status"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Engagement Form
                  </label>
                  <SearchableSelect
                    options={[
                      "DELEGATE",
                      "SPEAKER",
                      "SPONSOR",
                      "MEETING",
                      "RESEARCH_CALL",
                      "OPERATION",
                    ].map((s) => s.replace(/_/g, " "))}
                    value={formData.opportunity_engagement_form?.replace(
                      /_/g,
                      " ",
                    )}
                    onChange={(val) => {
                      const options = [
                        "DELEGATE",
                        "SPEAKER",
                        "SPONSOR",
                        "MEETING",
                        "RESEARCH_CALL",
                        "OPERATION",
                      ];
                      const originalValue =
                        options.find((s) => s.replace(/_/g, " ") === val) ||
                        val;
                      setFormData({
                        ...formData,
                        opportunity_engagement_form: originalValue,
                      });
                    }}
                    placeholder="Select Engagement"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Payment Status
                  </label>
                  <SearchableSelect
                    options={["PENDING", "PARTIAL", "PAID", "REFUNDED"]}
                    value={formData.opportunity_payment_status}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        opportunity_payment_status: val,
                      })
                    }
                    placeholder="Select Payment Status"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Loss Reason
                  </label>
                  <SearchableSelect
                    options={[
                      "BUDGET_CONSTRAINTS",
                      "TIMELINE_MISMATCH",
                      "COMPETITOR_SELECTED",
                      "NO_DECISION",
                      "NOT_INTERESTED",
                      "PRODUCT_FIT",
                      "INTERNAL_PRIORITIES_CHANGED",
                      "PRICING",
                    ].map((s) => s.replace(/_/g, " "))}
                    value={formData.opportunity_loss_reason?.replace(/_/g, " ")}
                    onChange={(val) => {
                      const options = [
                        "BUDGET_CONSTRAINTS",
                        "TIMELINE_MISMATCH",
                        "COMPETITOR_SELECTED",
                        "NO_DECISION",
                        "NOT_INTERESTED",
                        "PRODUCT_FIT",
                        "INTERNAL_PRIORITIES_CHANGED",
                        "PRICING",
                      ];
                      const originalValue =
                        options.find((s) => s.replace(/_/g, " ") === val) ||
                        val;
                      setFormData({
                        ...formData,
                        opportunity_loss_reason: originalValue,
                      });
                    }}
                    placeholder="Select Reason"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Pitched At
                  </label>
                  <input
                    type="date"
                    name="opportunity_pitched_at"
                    value={formData.opportunity_pitched_at}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Relations */}
          <div className="bg-vsph-grey p-5 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-vsph-navy rounded-full"></span>
              Relations (Optional)
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Linked Account
                  </label>
                  <SearchableSelect
                    options={accounts.map((a) => a.name)}
                    value={
                      accounts.find(
                        (a) => a.id === formData.opportunity_account_fk,
                      )?.name || formData.opportunity_account_fk
                    }
                    onChange={(val) => {
                      const acc = accounts.find((a) => a.name === val);
                      setFormData({
                        ...formData,
                        opportunity_account_fk: acc ? acc.id : val,
                      });
                    }}
                    placeholder="Select Account"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Linked Contact
                  </label>
                  <SearchableSelect
                    options={contacts.map((c) => c.name)}
                    value={
                      contacts.find(
                        (c) => c.id === formData.opportunity_contact_fk,
                      )?.name || formData.opportunity_contact_fk
                    }
                    onChange={(val) => {
                      const con = contacts.find((c) => c.name === val);
                      setFormData({
                        ...formData,
                        opportunity_contact_fk: con ? con.id : val,
                      });
                    }}
                    placeholder="Select Contact"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Project
                  </label>
                  <SearchableSelect
                    options={projects.map((p) => p.name)}
                    value={
                      projects.find(
                        (p) => p.id === formData.opportunity_project_id,
                      )?.name || formData.opportunity_project_id
                    }
                    onChange={(val) => {
                      const proj = projects.find((p) => p.name === val);
                      setFormData({
                        ...formData,
                        opportunity_project_id: proj ? proj.id : val,
                      });
                    }}
                    placeholder="Select Project"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Campaign
                  </label>
                  <SearchableSelect
                    options={campaigns}
                    value={formData.opportunity_campaign_id}
                    onChange={(val) =>
                      setFormData({ ...formData, opportunity_campaign_id: val })
                    }
                    placeholder="Select Campaign"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Logistics (Pickup & Drop) */}
          <div className="bg-vsph-grey p-5 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-vsph-navy rounded-full"></span>
              Logistics (Pickup & Drop)
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    name="opportunity_pickup_date"
                    value={formData.opportunity_pickup_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Pickup Time
                  </label>
                  <input
                    type="time"
                    name="opportunity_pickup_time"
                    value={formData.opportunity_pickup_time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    name="opportunity_pickup_location"
                    value={formData.opportunity_pickup_location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="e.g. Airport"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Drop Date
                  </label>
                  <input
                    type="date"
                    name="opportunity_drop_date"
                    value={formData.opportunity_drop_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Drop Time
                  </label>
                  <input
                    type="time"
                    name="opportunity_drop_time"
                    value={formData.opportunity_drop_time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Drop Location
                  </label>
                  <input
                    type="text"
                    name="opportunity_drop_location"
                    value={formData.opportunity_drop_location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="e.g. Hotel"
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

export default AddOpportunityModal;
