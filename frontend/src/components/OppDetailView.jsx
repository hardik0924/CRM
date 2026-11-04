import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { TrendingUp, Users, Briefcase, Calendar, Edit2, MoreHorizontal } from "lucide-react";
import Button from "./ui/Button";
import AddContactModal from "./modals/AddContactModal";
import ActivityFeed from "./ActivityFeed";
import { canDoAction } from "../utils/modules";

const STAGE_COLORS = {
  PITCH_DONE: "bg-vsph-core-blue text-white",
  FOLLOW_UP: "bg-vsph-light-blue text-vsph-navy",
  CONTRACT_OUT: "bg-amber-400 text-white",
  CLOSED_WON: "bg-emerald-500 text-white",
  CLOSED_LOST: "bg-rose-500 text-white",
  UNASSIGNED: "bg-slate-300 text-slate-600",
};

const OppDetailView = ({ isOpen, onClose, opportunityId, onEdit }) => {
  const canCreateContact = canDoAction("CONTACTS", "CREATE");
  const canEdit = canDoAction("OPPORTUNITIES", "EDIT");
  const canDelete = canDoAction("OPPORTUNITIES", "DELETE");
  const [oppData, setOppData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Details");
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    if (isOpen && opportunityId) {
      setLoading(true);
      api
        .get(`/api/opportunities/${opportunityId}`)
        .then((res) => {
          if (res.success) setOppData(res.data);
        })
        .catch((error) => console.error("Error fetching opportunity details:", error))
        .finally(() => setLoading(false));
    } else {
      setOppData(null);
      setActiveTab("Details");
    }
  }, [isOpen, opportunityId]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-50 font-sans animate-fade-in">
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : oppData ? (
          <div className="w-full mx-auto p-4 md:p-6 space-y-4">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 pb-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-blue-600 mb-1 font-semibold tracking-wide">
                    <span onClick={onClose} className="hover:underline cursor-pointer">Opportunities</span> &gt; {oppData.opportunity_name}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                    {oppData.opportunity_name}
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                    {oppData.opportunity_stage?.replace(/_/g, " ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {canCreateContact && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => { setAddContactOpen(true); }}
                      className="gap-2 font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                      <Users size={16} /> New Contact
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
                            onClick={() => { setMoreMenuOpen(false); onEdit?.(oppData); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                          >
                            Edit Opportunity
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete opportunity "${oppData.opportunity_name}"?`)) {
                                api.delete(`/api/opportunities/${opportunityId}`).then((res) => {
                                  if (res.success) {
                                    onClose();
                                  }
                                });
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            Delete Opportunity
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Close Date</span>
                  <span className="text-[13px] text-slate-800 font-semibold">
                    {oppData.opportunity_close_date ? new Date(oppData.opportunity_close_date).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Owner</span>
                  <span className="text-[13px] text-slate-800 font-semibold">{oppData.opportunity_owner?.user_name || "—"}</span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account</span>
                  <span className="text-[13px] text-slate-800 font-semibold">{oppData.opportunity_account?.account_name || "—"}</span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Stage</span>
                  <span className={`text-[13px] font-semibold ${STAGE_COLORS[oppData.opportunity_stage] || "bg-slate-300 text-slate-600"}`}>
                    {oppData.opportunity_stage?.replace(/_/g, " ") || "—"}
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
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Opportunity Information</span>
                        </button>
                        <div className="p-4 pt-6 px-6 pb-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opportunity Name</span>
                              <span className="text-[13px] font-semibold text-slate-700">{oppData.opportunity_name}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stage</span>
                              <span className={`text-[13px] font-semibold ${STAGE_COLORS[oppData.opportunity_stage] || "bg-slate-300 text-slate-600"}`}>
                                {oppData.opportunity_stage?.replace(/_/g, " ") || "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Close Date</span>
                              <span className="text-[13px] text-slate-700">
                                {oppData.opportunity_close_date ? new Date(oppData.opportunity_close_date).toLocaleDateString() : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Owner</span>
                              <span className="text-[13px] text-slate-700">{oppData.opportunity_owner?.user_name || "—"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account</span>
                              <span className="text-[13px] text-slate-700">{oppData.opportunity_account?.account_name || "—"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact</span>
                              <span className="text-[13px] text-slate-700">
                                {oppData.opportunity_contact ? `${oppData.opportunity_contact.contact_firstname || ""} ${oppData.opportunity_contact.contact_lastname || ""}`.trim() : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created</span>
                              <span className="text-[13px] text-slate-700">
                                {oppData.opportunity_created_at ? new Date(oppData.opportunity_created_at).toLocaleString("en-GB") : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === "Activity" && <ActivityFeed entity="opportunity" id={opportunityId} />}
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:w-[320px] flex-shrink-0 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                    <Briefcase size={14} className="text-[#0066cc]" /> RELATED
                  </div>
                  <div className="p-4 text-xs space-y-3 font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Account</span>
                      <span className="text-slate-800">{oppData.opportunity_account?.account_name || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Owner</span>
                      <span className="text-slate-800">{oppData.opportunity_owner?.user_name || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Stage</span>
                      <span className={`text-slate-800 ${STAGE_COLORS[oppData.opportunity_stage] || "bg-slate-300 text-slate-600"}`}>
                        {oppData.opportunity_stage?.replace(/_/g, " ") || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full text-slate-500 font-semibold">
            Opportunity not found.
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
    </div>
  );
};

export default OppDetailView;
