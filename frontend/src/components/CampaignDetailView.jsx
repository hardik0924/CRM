import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { Megaphone, Users, Calendar, Edit2, MoreHorizontal } from "lucide-react";
import Button from "./ui/Button";
import AddContactModal from "./modals/AddContactModal";
import ActivityFeed from "./ActivityFeed";
import { canDoAction } from "../utils/modules";

const CampaignDetailView = ({ isOpen, onClose, campaignId, onEdit }) => {
  const canCreateContact = canDoAction("CONTACTS", "CREATE");
  const canEdit = canDoAction("CAMPAIGNS", "EDIT");
  const canDelete = canDoAction("CAMPAIGNS", "DELETE");
  const [campData, setCampData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Details");
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    if (isOpen && campaignId) {
      setLoading(true);
      api
        .get(`/api/campaigns/${campaignId}`)
        .then((res) => {
          if (res.success) setCampData(res.data);
        })
        .catch((error) => console.error("Error fetching campaign details:", error))
        .finally(() => setLoading(false));
    } else {
      setCampData(null);
      setActiveTab("Details");
    }
  }, [isOpen, campaignId]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-50 font-sans animate-fade-in">
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : campData ? (
          <div className="w-full mx-auto p-4 md:p-6 space-y-4">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 pb-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-blue-600 mb-1 font-semibold tracking-wide">
                    <span onClick={onClose} className="hover:underline cursor-pointer">Campaigns</span> &gt; {campData.campaign_name}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                    {campData.campaign_name}
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                    Campaign
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
                            onClick={() => { setMoreMenuOpen(false); onEdit?.(campData); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                          >
                            Edit Campaign
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete campaign "${campData.campaign_name}"?`)) {
                                api.delete(`/api/campaigns/${campaignId}`).then((res) => {
                                  if (res.success) {
                                    onClose();
                                  }
                                });
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            Delete Campaign
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Owner</span>
                  <span className="text-[13px] text-slate-800 font-semibold">{campData.user?.user_name || "—"}</span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contacts</span>
                  <span className="text-[13px] text-slate-800 font-semibold">{campData._count?.contacts || 0}</span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Opportunities</span>
                  <span className="text-[13px] text-slate-800 font-semibold">{campData._count?.opportunities || 0}</span>
                </div>
                <div className="flex flex-col min-w-[120px]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Created</span>
                  <span className="text-[13px] text-slate-800 font-semibold">
                    {campData.campaign_created_at ? new Date(campData.campaign_created_at).toLocaleDateString() : "—"}
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
                      { id: "Contacts", label: `Contacts (${campData._count?.contacts || 0})` },
                      { id: "Opportunities", label: `Opportunities (${campData._count?.opportunities || 0})` },
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
                          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Campaign Information</span>
                        </button>
                        <div className="p-4 pt-6 px-6 pb-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Campaign Name</span>
                              <span className="text-[13px] font-semibold text-slate-700">{campData.campaign_name}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Owner</span>
                              <span className="text-[13px] text-slate-700">{campData.user?.user_name || "—"}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contacts</span>
                              <span className="text-[13px] text-slate-700">{campData._count?.contacts || 0}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Opportunities</span>
                              <span className="text-[13px] text-slate-700">{campData._count?.opportunities || 0}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Created</span>
                              <span className="text-[13px] text-slate-700">
                                {campData.campaign_created_at ? new Date(campData.campaign_created_at).toLocaleString("en-GB") : "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === "Contacts" && (
                    <div className="p-0">
                      {campData.contacts?.length > 0 ? (
                        <div className="divide-y divide-slate-200">
                          {campData.contacts.map((contact) => (
                            <div key={contact.contact_id} className="p-4 flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-sm text-blue-600">
                                  {contact.contact_firstname} {contact.contact_lastname}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">{contact.contact_professional_email || 'No email'}</div>
                              </div>
                              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                                {contact.contact_call_status?.replace(/_/g, ' ') || '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">
                          No contacts linked to this campaign.
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "Opportunities" && (
                    <div className="p-0">
                      {campData.opportunities?.length > 0 ? (
                        <div className="divide-y divide-slate-200">
                          {campData.opportunities.map((opportunity) => (
                            <div key={opportunity.opportunity_id} className="p-4 flex justify-between items-center">
                              <div>
                                <div className="font-semibold text-sm text-blue-600">{opportunity.opportunity_name}</div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {opportunity.opportunity_stage?.replace(/_/g, ' ') || 'No stage'}
                                </div>
                              </div>
                              <div className="text-right text-xs font-medium text-slate-700">
                                {opportunity.opportunity_close_date
                                  ? new Date(opportunity.opportunity_close_date).toLocaleDateString()
                                  : 'No close date'}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">
                          No opportunities linked to this campaign.
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "Activity" && <ActivityFeed entity="campaign" id={campaignId} />}
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:w-[320px] flex-shrink-0 space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                    <Megaphone size={14} className="text-[#0066cc]" /> CAMPAIGN INFO
                  </div>
                  <div className="p-4 text-xs space-y-3 font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Owner</span>
                      <span className="text-slate-800">{campData.user?.user_name || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Contacts</span>
                      <span className="text-slate-800">{campData._count?.contacts || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Opportunities</span>
                      <span className="text-slate-800">{campData._count?.opportunities || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full text-slate-500 font-semibold">
            Campaign not found.
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

export default CampaignDetailView;
