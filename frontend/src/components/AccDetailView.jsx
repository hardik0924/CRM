import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { Users, Target, MoreHorizontal, Edit2, Menu } from "lucide-react";
import Button from "./ui/Button";
import AddContactModal from "./modals/AddContactModal";
import AddOpportunityModal from "./modals/AddOpportunityModal";
import ActivityFeed from "./ActivityFeed";
import { canDoAction } from "../utils/modules";

const AccountDetailView = ({ isOpen, onClose, accountId, onEdit }) => {
  const canCreateContact = canDoAction("CONTACTS", "CREATE");
  const canCreateOpportunity = canDoAction("OPPORTUNITIES", "CREATE");
  const canEdit = canDoAction("ACCOUNTS", "EDIT");
  const canDelete = canDoAction("ACCOUNTS", "DELETE");
  const showMoreMenu = canEdit || canDelete;
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("Details");
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addOpportunityOpen, setAddOpportunityOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    if (isOpen && accountId) {
      setLoading(true);
      api
        .get(`/api/accounts/${accountId}`)
        .then((res) => {
          if (res.success) {
            setAccountData(res.data);
          }
        })
        .catch((error) => console.error("Error fetching account details:", error))
        .finally(() => setLoading(false));
    } else {
      setAccountData(null);
      setActiveTab("Details");
    }
  }, [isOpen, accountId]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-50 font-sans animate-fade-in">
      
      <div className="flex-1 overflow-y-auto bg-slate-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : accountData ? (
          <div className="w-full mx-auto p-4 md:p-6 space-y-4">
            
            {/* 1. Header Section */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 pb-0">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-blue-600 mb-1 font-semibold tracking-wide">
                    <span onClick={onClose} className="hover:underline cursor-pointer">Accounts</span> &gt; {accountData.account_name}
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3 tracking-tight">
                    {accountData.account_name}
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">{accountData.account_code}</p>
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
                  {canCreateOpportunity && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => { setAddOpportunityOpen(true); }}
                      className="gap-2 font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                      <Target size={16} /> New Opportunity
                    </Button>
                  )}
                  {showMoreMenu && (
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
                            onClick={() => { setMoreMenuOpen(false); onEdit?.(accountData); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                          >
                            Edit Account
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete account "${accountData.account_name}"?`)) {
                                api.delete("/api/accounts", { ids: [accountId] }).then((res) => {
                                  if (res.success) {
                                    onClose();
                                  }
                                });
                              }
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            Delete Account
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
                <HighlightItem label="PHONE" value={accountData.account_phone} />
                <HighlightItem label="INDUSTRY" value={accountData.account_industry} />
                <HighlightItem label="WEBSITE" value={accountData.account_website} />
                <HighlightItem label="ACCOUNT OWNER" value={accountData.owner?.user_name} />
                <HighlightItem label="EMPLOYEES" value={accountData.account_employees_size} />
              </div>
            </div>

            {/* 2. Main Content Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Column - Details */}
              <div className="flex-1 space-y-4">
                
                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                  <div className="flex border-b border-slate-200 px-4 overflow-x-auto custom-scrollbar">
                    {[
                      { id: 'Details', label: 'Details' },
                      { id: 'Contacts', label: `Contacts (${accountData.account_contacts?.length || 0})` },
                      { id: 'Opportunities', label: `Opportunities (${accountData.opportunities?.length || 0})` },
                      { id: 'Member Accounts', label: `Member Accounts (${accountData.account_children?.length || 0})` },
                      { id: 'Activity', label: 'Activity' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-600 text-blue-700'
                            : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {activeTab === "Details" && (
                    <div className="p-0">
                      
                      {/* Account Information Section */}
                      <CollapsibleSection title="ACCOUNT INFORMATION">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                          <FieldItem label="ACCOUNT NAME" value={accountData.account_name} />
                          <FieldItem label="ACCOUNT OWNER" value={accountData.owner?.user_name} isLink />
                          <FieldItem label="ACCOUNT ID" value={accountData.account_code} />
                          <FieldItem label="TYPE" value={accountData.account_type} />
                          <FieldItem label="PHONE" value={accountData.account_phone} />
                          <FieldItem label="WEBSITE" value={accountData.account_website} isLink hasEdit />
                          <FieldItem label="CITY" value={accountData.account_city} />
                          <FieldItem label="COUNTRY" value={accountData.account_country} />
                          <FieldItem label="INDUSTRY" value={accountData.account_industry} />
                          <FieldItem label="EMPLOYEE SIZE" value={accountData.account_employees_size} />
                          <FieldItem label="PARENT ACCOUNT" value="—" />
                          <FieldItem label="CREATED" value={new Date(accountData.account_created_at).toLocaleString('en-GB')} />
                        </div>
                      </CollapsibleSection>

                      {/* Address Information Section */}
                      <CollapsibleSection title="ADDRESS INFORMATION">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                          <FieldItem 
                            label="BILLING ADDRESS" 
                            value={accountData.account_billing_address?.[0] ? 
                              `${accountData.account_billing_address[0].billing_street || ''}\n${accountData.account_billing_address[0].billing_city || ''}, ${accountData.account_billing_address[0].billing_state || ''} ${accountData.account_billing_address[0].billing_zip || ''}\n${accountData.account_billing_address[0].billing_country || ''}`.trim() 
                              : "—"} 
                          />
                          <FieldItem 
                            label="SHIPPING ADDRESS" 
                            value={accountData.account_shipping_address?.[0] ? 
                              `${accountData.account_shipping_address[0].shipping_street || ''}\n${accountData.account_shipping_address[0].shipping_city || ''}, ${accountData.account_shipping_address[0].shipping_state || ''} ${accountData.account_shipping_address[0].shipping_zip || ''}\n${accountData.account_shipping_address[0].shipping_country || ''}`.trim() 
                              : "—"} 
                          />
                        </div>
                      </CollapsibleSection>

                    </div>
                  )}
                  {activeTab === "Contacts" && (
                    <div className="p-0">
                      {accountData.account_contacts?.length > 0 ? (
                        <div className="divide-y divide-slate-200">
                          {accountData.account_contacts.map(contact => (
                            <div key={contact.contact_id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center group">
                               <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
                                     {contact.contact_firstname?.[0] || ''}{contact.contact_lastname?.[0] || ''}
                                  </div>
                                  <div>
                                     <div className="font-semibold text-sm text-blue-600 group-hover:underline cursor-pointer">
                                        {contact.contact_firstname} {contact.contact_lastname}
                                     </div>
                                     <div className="text-xs text-slate-500 mt-0.5">
                                        {contact.contact_designation || 'No Designation'} {contact.contact_professional_email ? `• ${contact.contact_professional_email}` : ''}
                                     </div>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <div className="text-xs font-medium text-slate-700">{contact.contact_mobile || contact.contact_phone || 'No Phone'}</div>
                                  <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{contact.contact_status || 'ACTIVE'}</div>
                               </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">
                           No contacts associated with this account.
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "Opportunities" && (
                    <div className="p-0">
                      {accountData.opportunities?.length > 0 ? (
                        <div className="divide-y divide-slate-200">
                          {accountData.opportunities.map(opportunity => (
                            <div key={opportunity.opportunity_id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                               <div>
                                  <div className="font-semibold text-sm text-blue-600">
                                     {opportunity.opportunity_name}
                                  </div>
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
                           No opportunities associated with this account.
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "Member Accounts" && (
                    <div className="p-0">
                      {accountData.account_children?.length > 0 ? (
                        <div className="divide-y divide-slate-200">
                          {accountData.account_children.map(child => (
                            <div key={child.account_id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                               <div>
                                  <div className="font-semibold text-sm text-blue-600">{child.account_name}</div>
                                  <div className="text-xs text-slate-500 mt-0.5">{child.account_code}</div>
                               </div>
                               <div className="text-[10px] text-slate-400 uppercase tracking-wider">{child.account_account_status || 'ACTIVE'}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-sm font-semibold text-slate-500">
                           No member accounts linked to this account.
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "Activity" && <ActivityFeed entity="account" id={accountData.account_id} />}
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="lg:w-[320px] flex-shrink-0 space-y-4">
                
                {/* Related Card */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                    <Users size={14} className="text-[#0066cc]" /> RELATED CONTACTS
                  </div>
                  <div className="divide-y divide-slate-100">
                    {accountData.account_contacts?.length > 0 ? (
                      accountData.account_contacts.slice(0, 5).map(contact => (
                        <RelatedItem 
                          key={contact.contact_id} 
                          name={`${contact.contact_firstname || ''} ${contact.contact_lastname || ''}`.trim() || 'Unknown'} 
                        />
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-500">No related contacts found.</div>
                    )}
                  </div>
                </div>

                {/* Recent Card */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider bg-slate-50">
                    RECENT
                  </div>
                  <div className="p-4 text-xs space-y-3 font-semibold">
                    <RecentItem type="ACCOUNT" name="Swiss GRC" />
                    <RecentItem type="CONTACT" name="Aarti Samant" />
                    <RecentItem type="CONTACT" name="Aarti A" />
                    <RecentItem type="CONTACT" name="Aarti Vishal Patil" />
                    <RecentItem type="CONTACT" name="Aarti Kulkarni Bahulikar" />
                  </div>
                </div>

              </div>

            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-full text-slate-500 font-semibold">
            Account not found.
          </div>
        )}
      </div>

      {addContactOpen && (
        <AddContactModal
          isOpen={addContactOpen}
          onClose={() => setAddContactOpen(false)}
          onSuccess={() => {
            setAddContactOpen(false);
            // Refresh account data to show new contact
            api.get(`/api/accounts/${accountId}`).then((res) => {
              if (res.success) setAccountData(res.data);
            });
          }}
          contactToEdit={null}
          defaultAccountId={accountId}
        />
      )}

      {addOpportunityOpen && (
        <AddOpportunityModal
          isOpen={addOpportunityOpen}
          onClose={() => setAddOpportunityOpen(false)}
          onSuccess={() => {
            setAddOpportunityOpen(false);
            api.get(`/api/accounts/${accountId}`).then((res) => {
              if (res.success) setAccountData(res.data);
            });
          }}
          opportunityToEdit={null}
          defaultAccountId={accountId}
        />
      )}
    </div>
  );
};

/* --- Helper UI Components --- */

const HighlightItem = ({ label, value }) => (
  <div className="flex flex-col min-w-[120px]">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
    <span className="text-[13px] text-slate-800 font-semibold">{value || "—"}</span>
  </div>
);

const CollapsibleSection = ({ title, children }) => (
  <div className="border-b border-slate-200 last:border-0">
    <button className="w-full px-4 py-3 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors group">
      <span className="text-[9px] transform transition-transform group-hover:text-blue-600 text-slate-400">▼</span>
      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{title}</span>
    </button>
    <div className="p-4 pt-6 px-6 pb-8">
      {children}
    </div>
  </div>
);

const FieldItem = ({ label, value, isLink, hasEdit }) => (
  <div className="flex flex-col relative group">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
    <div className="flex items-center justify-between border-b border-transparent group-hover:border-slate-200 pb-1 -mb-1 min-h-[24px]">
      {isLink && value && value !== "—" ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer" className="text-[13px] text-blue-600 hover:underline break-words font-semibold">
          {value}
        </a>
      ) : (
        <span className="text-[13px] text-slate-800 whitespace-pre-wrap font-medium">{value || "—"}</span>
      )}
      {hasEdit && (
        <button className="text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <Edit2 size={12} />
        </button>
      )}
    </div>
  </div>
);

const RelatedItem = ({ name }) => (
  <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer group transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center text-blue-600">
        <Users size={12} />
      </div>
      <span className="text-[13px] text-blue-600 font-semibold group-hover:underline">{name}</span>
    </div>
    <span className="text-slate-400">›</span>
  </div>
);

const RecentItem = ({ type, name }) => (
  <div className="flex items-center gap-2 cursor-pointer group">
    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{type}</span>
    <span className="text-[13px] text-blue-600 group-hover:underline font-semibold">{name}</span>
  </div>
);

export default AccountDetailView;
