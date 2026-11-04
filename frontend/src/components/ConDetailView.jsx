import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import {
  MoreHorizontal,
  UserPlus,
  Edit,
  Phone,
  Mail,
  CheckCircle,
  Bell,
  Save,
  Clock,
  ChevronDown,
  User,
  ExternalLink,
} from "lucide-react";
import Button from "./ui/Button";
import AddContactModal from "./modals/AddContactModal";
import AddCampaignModal from "./modals/AddCampaignModal";
import { canDoAction, hasModule } from "../utils/modules";

const ConDetailView = ({ isOpen, onClose, contactId }) => {
  const navigate = useNavigate();
  const canEditContact = canDoAction("CONTACTS", "EDIT");
  const canDeleteContact = canDoAction("CONTACTS", "DELETE");
  const [contactData, setContactData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("Details");
  const [activeSidebarTab, setActiveSidebarTab] = useState("Call");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentUser, setCurrentUser] = useState(null);

  // Modal states
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addCampaignOpen, setAddCampaignOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // New State for calls
  const [callSubject, setCallSubject] = useState("");
  const [callDescription, setCallDescription] = useState("");
  const [savingCall, setSavingCall] = useState(false);
  const [callsList, setCallsList] = useState([]);
  const [taskSubject, setTaskSubject] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("NORMAL");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDueTimeHH, setTaskDueTimeHH] = useState("12");
  const [taskDueTimeMM, setTaskDueTimeMM] = useState("00");
  const [taskDueTimeAMPM, setTaskDueTimeAMPM] = useState("PM");
  const [savingTask, setSavingTask] = useState(false);
  const [tasksList, setTasksList] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("vsph_user_id");
    const userName = localStorage.getItem("vsph_user_name");
    if (userId) {
      setCurrentUser({ user_id: userId, id: userId, name: userName, user_name: userName });
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    const timeStr = date
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
      .toLowerCase();

    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return `${timeStr} ${dateStr}`;
  };

  useEffect(() => {
    if (isOpen && contactId) {
      setLoading(true);
      Promise.all([
        api.get(`/api/contacts/${contactId}`),
        api.get(`/api/calls?contact_id=${contactId}`),
        api.get(`/api/tasks?contact_id=${contactId}`),
      ])
        .then(([contactRes, callsRes, tasksRes]) => {
          if (contactRes.success) setContactData(contactRes.data);
          if (Array.isArray(callsRes)) setCallsList(callsRes);
          if (tasksRes.success) setTasksList(tasksRes.data || []);
          else if (Array.isArray(tasksRes)) setTasksList(tasksRes);
        })
        .catch((error) =>
          console.error("Error fetching contact details:", error),
        )
        .finally(() => setLoading(false));
    } else {
      setContactData(null);
      setCallsList([]);
      setTasksList([]);
      setActiveMainTab("Details");
      setActiveSidebarTab("Call");
      setCallSubject("");
      setCallDescription("");
      setTaskSubject("");
      setTaskDescription("");
      setTaskPriority("NORMAL");
    }
  }, [isOpen, contactId]);

  const handleSaveCall = async () => {
    if (!callSubject.trim() || !callDescription.trim()) return;
    setSavingCall(true);
    try {
      const payload = {
        call_user_fk: currentUser?.user_id || currentUser?.id,
        call_contact_fk: contactId,
        call_subject: callSubject,
        call_description: callDescription,
      };

      const newCall = await api.post("/api/calls", payload);

      if (newCall.error) {
        throw new Error(newCall.error);
      }

      const callToPush = {
        ...newCall,
        user: {
          user_id: currentUser?.user_id,
          user_name: currentUser?.user_name || currentUser?.name || "Unknown",
        },
      };

      setCallsList((prev) => [callToPush, ...prev]);

      setCallSubject("");
      setCallDescription("");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCall(false);
    }
  };

  const handleSaveTask = async () => {
    if (!taskSubject.trim()) return;

    setSavingTask(true);
    try {
      let combinedDueDate = null;
      if (taskDueDate) {
        const dateObj = new Date(taskDueDate);
        let hours = parseInt(taskDueTimeHH, 10);
        const minutes = parseInt(taskDueTimeMM, 10);
        if (taskDueTimeAMPM === "PM" && hours !== 12) hours += 12;
        if (taskDueTimeAMPM === "AM" && hours === 12) hours = 0;
        dateObj.setHours(hours, minutes);
        combinedDueDate = dateObj.toISOString();
      }

      const payload = {
        task_subject: taskSubject,
        task_description: taskDescription,
        task_priority: taskPriority,
        task_contact_fk: contactId,
        task_user_fk: currentUser?.id || currentUser?.user_id,
        task_due_date: combinedDueDate,
      };

      const newTask = await api.post("/api/tasks", payload);

      if (newTask.error) throw new Error(newTask.error);

      const taskToPush = {
        ...newTask,
        user: {
          user_id: currentUser?.id || currentUser?.user_id,
          user_name: currentUser?.name || currentUser?.user_name || "Unknown",
        },
      };

      setTasksList((prev) => [taskToPush, ...prev]);

      setTaskSubject("");
      setTaskDescription("");
      setTaskPriority("NORMAL");
      setTaskDueDate("");
      setTaskDueTimeHH("12");
      setTaskDueTimeMM("00");
      setTaskDueTimeAMPM("PM");
    } catch (err) {
      console.error("Error saving task:", err);
    } finally {
      setSavingTask(false);
    }
  };

  const handleEditContact = () => {
    setEditContactOpen(true);
  };

  const handleDeleteContact = () => {
    if (window.confirm(`Delete contact "${fullName}"?`)) {
      api.delete(`/api/contacts/${contactId}`).then((res) => {
        if (res.success) {
          onClose();
        }
      });
    }
  };

  const handleAddToCampaign = () => {
    setAddCampaignOpen(true);
  };

  const handleViewAccount = () => {
    if (contactData?.contact_account_fk) {
      navigate(`/v2/accounts?account_id=${contactData.contact_account_fk}`);
    }
  };

  if (!isOpen) return null;

  const fullName =
    `${contactData?.contact_firstname || ""} ${contactData?.contact_lastname || ""}`.trim();
  const title =
    contactData?.contact_title ||
    contactData?.contact_designation ||
    "No Title";
  const accountName = contactData?.account?.account_name || "-";
  const mobile =
    contactData?.contact_mobile || contactData?.contact_phone || "-";
  const email =
    contactData?.contact_professional_email ||
    contactData?.contact_personal_email ||
    "-";
  const owner = contactData?.contact_owner?.user_name || "Unknown";
  const combinedTimeline = [
    ...callsList.map((call) => ({
      ...call,
      type: "call",
      sortDate: new Date(call.call_created_at || Date.now()),
    })),
    ...tasksList.map((task) => ({
      ...task,
      type: "task",
      sortDate: new Date(task.task_created_at || Date.now()),
    })),
  ].sort((a, b) => b.sortDate - a.sortDate);

  const displayedTimeline = activeSidebarTab === "Call"
    ? combinedTimeline.filter(item => item.type === "call")
    : activeSidebarTab === "Task"
    ? combinedTimeline.filter(item => item.type === "task")
    : combinedTimeline;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-slate-50 font-sans">
      <div className="flex-1 flex flex-col bg-slate-50 min-h-0">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : contactData ? (
          <div className="w-full mx-auto flex flex-col h-full min-h-0">
            {/* Top Section */}
            <div className="bg-white shadow-sm border-b border-slate-200 shrink-0">
              {/* DIV 1: Breadcrumb & Actions */}
              <div className="flex justify-between items-start px-6 pt-4 mb-2">
                <div>
                  <div className="text-[13px] text-blue-600 mb-1 font-semibold flex items-center gap-2">
                    <span
                      onClick={() => navigate("/v2/contacts")}
                      className="hover:underline cursor-pointer"
                    >
                      Contacts
                    </span>
                    <span className="text-slate-400">&gt;</span>
                    <span className="text-slate-600">{fullName}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-1.5">
                    {fullName}
                  </h1>
                  <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-2">
                    <span>{contactData.contact_code || "UNKNOWN"}</span>
                    <span className="text-slate-300">•</span>
                    <span>{title}</span>
                    <span className="text-slate-300">•</span>
                    <span
                      className="text-blue-600 cursor-pointer hover:underline"
                      onClick={handleViewAccount}
                    >
                      {accountName}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {canEditContact && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddToCampaign}
                      className="gap-2 font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus size={14} strokeWidth={2.5} /> Add to Campaign
                    </Button>
                  )}
                  {canEditContact && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEditContact}
                      className="gap-2 font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit size={14} strokeWidth={2.5} /> Edit
                    </Button>
                  )}
                  {(canEditContact || canDeleteContact) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setMoreMenuOpen(true)}
                    className="border-slate-300 px-2 relative"
                  >
                    <MoreHorizontal size={14} className="text-slate-600" />
                    {moreMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                        {canEditContact && (
                          <button
                            onClick={() => { setMoreMenuOpen(false); handleEditContact(); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                          >
                            Edit Contact
                          </button>
                        )}
                        {canDeleteContact && (
                          <button
                            onClick={() => { setMoreMenuOpen(false); handleDeleteContact(); }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          >
                            Delete Contact
                          </button>
                        )}
                      </div>
                    )}
                  </Button>
                  )}
                </div>
              </div>

              {/* DIV 2: Highlights */}
              <div className="flex border-t border-slate-100 mt-4 px-6 py-3">
                <div className="flex-1 border-r border-slate-100 px-4 first:pl-0 last:border-r-0">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Mobile
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-blue-600 flex items-center gap-1.5">
                      <Phone size={14} /> {mobile}
                    </span>
                    <button className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      <Phone size={10} /> Log Call
                    </button>
                  </div>
                </div>
                <div className="flex-1 border-r border-slate-100 px-4 last:border-r-0">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Email
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    {email !== "-" ? email : "—"}
                  </span>
                </div>
                <div className="flex-1 border-r border-slate-100 px-4 last:border-r-0">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Account
                  </span>
                  <span
                    className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer"
                    onClick={handleViewAccount}
                  >
                    {accountName}
                  </span>
                </div>
                <div className="flex-1 border-r border-slate-100 px-4 last:border-r-0">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Call Status
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    {contactData.contact_call_status || "—"}
                  </span>
                </div>
                <div className="flex-1 px-4 last:border-r-0">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Owner
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    {owner}
                  </span>
                </div>
              </div>

              {/* DIV 3: Navigations */}
              <div className="flex gap-6 px-6 border-t border-slate-100">
                {["Details", "Opportunities", "Accuracy", "Related"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveMainTab(tab)}
                      className={`py-3 text-[13px] font-bold transition-colors border-b-2 ${
                        activeMainTab === tab
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-600 hover:text-blue-600"
                      }`}
                    >
                      {tab}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Main Content Layout */}
            {activeMainTab === "Details" && (
              <div className="flex flex-col lg:flex-row gap-4 p-4 lg:p-6 flex-1 min-h-0">
                <div className="flex-1 bg-white border border-slate-200 shadow-sm overflow-y-auto overscroll-y-contain pb-4">
                  <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Contact Information
                    </h3>
                    <ChevronDown size={16} className="text-slate-400" />
                  </div>

                  <div className="flex flex-col">
                    <GridRow
                      left={{
                        label: "First Name",
                        value: contactData.contact_firstname || "—",
                        isLink: false,
                      }}
                      right={{
                        label: "Contact Owner",
                        value: owner,
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Last Name",
                        value: contactData.contact_lastname || "—",
                        isLink: false,
                      }}
                      right={{
                        label: "Campaign",
                        value:
                          contactData.contact_campaign?.campaign_name || "—",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Account Name",
                        value: accountName,
                        isLink: true,
                        icon: <Edit size={12} className="ml-1 opacity-50" />,
                        onClick: handleViewAccount,
                      }}
                      right={{
                        label: "Project Name",
                        value: contactData.contact_project?.project_name || "—",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Designation",
                        value: title,
                        isLink: false,
                      }}
                      right={{
                        label: "Call Status",
                        value: contactData.contact_call_status || "—",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Email ID (Professional)",
                        value: contactData.contact_professional_email || "—",
                        isLink: !!contactData.contact_professional_email,
                        onClick: () => {
                          if (contactData.contact_professional_email) {
                            window.location.href = `mailto:${contactData.contact_professional_email}`;
                          }
                        },
                      }}
                      right={{
                        label: "Partner Name",
                        value: contactData.contact_partner_name || "—",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Mobile No",
                        value:
                          contactData.contact_mobile ||
                          contactData.contact_phone ||
                          "—",
                        isLink: true,
                        onClick: () => {
                          const phone =
                            contactData.contact_mobile ||
                            contactData.contact_phone;
                          if (phone) window.location.href = `tel:${phone}`;
                        },
                      }}
                      right={{
                        label: "Email Status",
                        value: contactData.contact_email_status || "Not Found",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Department",
                        value: contactData.contact_department || "—",
                        isLink: false,
                      }}
                      right={{
                        label: "Number Status",
                        value: contactData.contact_phone_status || "Generated",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Profile Link",
                        value: contactData.contact_profile_link
                          ? "View Profile"
                          : "—",
                        isLink: !!contactData.contact_profile_link,
                        onClick: () => {
                          if (contactData.contact_profile_link) {
                            window.open(contactData.contact_profile_link, "_blank");
                          }
                        },
                      }}
                      right={{
                        label: "Employee Size",
                        value: contactData.contact_employee_size || "—",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Level",
                        value: contactData.contact_level_field || "—",
                        isLink: false,
                      }}
                      right={{
                        label: "Email ID (Personal)",
                        value: contactData.contact_personal_email || "—",
                        isLink: !!contactData.contact_personal_email,
                        onClick: () => {
                          if (contactData.contact_personal_email) {
                            window.location.href = `mailto:${contactData.contact_personal_email}`;
                          }
                        },
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Alternate No",
                        value: contactData.contact_alternate_number || "—",
                        isLink: true,
                        onClick: () => {
                          if (contactData.contact_alternate_number) {
                            window.location.href = `tel:${contactData.contact_alternate_number}`;
                          }
                        },
                      }}
                      right={{
                        label: "Industry",
                        value:
                          contactData.contact_industry?.industry_name || "—",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Segment",
                        value: contactData.contact_segment || "—",
                        isLink: false,
                      }}
                      right={{
                        label: "Navigator Link",
                        value: contactData.contact_navigator_link || "—",
                        isLink: !!contactData.contact_navigator_link,
                        onClick: () => {
                          if (contactData.contact_navigator_link) {
                            window.open(contactData.contact_navigator_link, "_blank");
                          }
                        },
                      }}
                    />
                  </div>

                  {/* Contact Details */}
                  <div className="flex items-center justify-between p-4 border-b border-t border-slate-200 bg-slate-50/50">
                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Contact Details
                    </h3>
                    <ChevronDown size={16} className="text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <GridRow
                      left={{
                        label: "Salutation",
                        value: contactData.contact_salutation || "—",
                        isLink: false,
                      }}
                      right={{
                        label: "TPID",
                        value: contactData.contact_tpid || "—",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Middle Name",
                        value: contactData.contact_middlename || "—",
                        isLink: false,
                      }}
                      right={{
                        label: "Fax Number",
                        value: contactData.contact_fax_number || "—",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Suffix",
                        value: contactData.contact_suffix || "—",
                        isLink: false,
                      }}
                      right={{
                        label: "Landline Number",
                        value: contactData.contact_landline_number || "—",
                        isLink: false,
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Role",
                        value: contactData.contact_role || "—",
                        isLink: false,
                      }}
                      right={{
                        label: "Contact Status",
                        value: contactData.contact_status || "—",
                        isLink: false,
                      }}
                    />
                  </div>

                  {/* Mailing Box */}
                  <div className="flex items-center justify-between p-4 border-b border-t border-slate-200 bg-slate-50/50">
                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Mailing Box
                    </h3>
                    <ChevronDown size={16} className="text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <GridRow
                      left={{ label: "Mailing Street", value: "—" }}
                      right={{ label: "Mailing State/Province", value: "—" }}
                    />
                    <GridRow
                      left={{ label: "Mailing City", value: "—" }}
                      right={{ label: "Mailing Zip/Postal Code", value: "—" }}
                    />
                    <GridRow
                      left={{ label: "Mailing Country", value: "—" }}
                      right={{ label: "PO Box", value: "—" }}
                    />
                  </div>

                  {/* Mailing Address */}
                  <div className="flex items-center justify-between p-4 border-b border-t border-slate-200 bg-slate-50/50">
                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Mailing Address
                    </h3>
                    <ChevronDown size={16} className="text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <GridRow
                      left={{
                        label: "City",
                        value: contactData.contact_city || "—",
                      }}
                      right={{
                        label: "State",
                        value: contactData.contact_state || "—",
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Country",
                        value: contactData.contact_country || "—",
                      }}
                      right={{ label: "Location", value: "—" }}
                    />
                  </div>

                  {/* Pick & Drop */}
                  <div className="flex items-center justify-between p-4 border-b border-t border-slate-200 bg-slate-50/50">
                    <h3 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Pick & Drop
                    </h3>
                    <ChevronDown size={16} className="text-slate-400" />
                  </div>
                  <div className="flex flex-col">
                    <GridRow
                      left={{
                        label: "Pickup Date",
                        value: contactData.contact_pickup_date
                          ? new Date(
                              contactData.contact_pickup_date,
                            ).toLocaleDateString()
                          : "—",
                      }}
                      right={{
                        label: "Drop Date",
                        value: contactData.contact_drop_date
                          ? new Date(
                              contactData.contact_drop_date,
                            ).toLocaleDateString()
                          : "—",
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Pickup Time",
                        value: contactData.contact_pickup_time || "—",
                      }}
                      right={{
                        label: "Drop Time",
                        value: contactData.contact_drop_time || "—",
                      }}
                    />
                    <GridRow
                      left={{
                        label: "Pickup Location",
                        value: contactData.contact_pickup_location || "—",
                      }}
                      right={{
                        label: "Drop Location",
                        value: contactData.contact_drop_location || "—",
                      }}
                    />
                  </div>
                </div>

                {/* Right Column - Sidebar */}
                <div className="w-full lg:w-[320px] xl:w-[380px] space-y-4 shrink-0 overflow-y-auto max-h-full">
                  {/* Activity Form Block */}
                  <div className="bg-white border border-slate-200 shadow-sm">
                    {/* Activity Tabs */}
                    <div className="flex items-center justify-between border-b border-slate-200 px-2 pt-2 bg-slate-50/50">
                      <div className="flex">
                        {[
                          { id: "Call", label: "Call", icon: Phone },
                          { id: "Task", label: "Task", icon: CheckCircle },
                          { id: "Email", label: "Email", icon: Mail },
                        ]
                          .filter((tab) =>
                            tab.id === "Call"
                              ? canDoAction("CONTACTS", "CREATE")
                              : tab.id === "Task"
                                ? hasModule("TASKS") && canDoAction("TASKS", "CREATE")
                                : true
                          )
                          .map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveSidebarTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors ${
                              activeSidebarTab === tab.id
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                          >
                            <tab.icon size={14} /> {tab.label}
                          </button>
                        ))}
                      </div>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600">
                        <Bell size={14} />
                      </button>
                    </div>

                    {/* Log A Call Form */}
                    {activeSidebarTab === "Call" && (
                      <div className="p-4">
                        <h4 className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                          <Phone size={14} /> Log A Call
                        </h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={callSubject}
                              onChange={(e) => setCallSubject(e.target.value)}
                              placeholder="Select an outcome or type your own..."
                              className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              Pick an outcome from the list or type your own.
                            </p>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Call Notes / Description
                            </label>
                            <textarea
                              value={callDescription}
                              onChange={(e) =>
                                setCallDescription(e.target.value)}
                              placeholder="What was discussed..."
                              rows={3}
                              className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 resize-none"
                            />
                          </div>

                          <div className="flex gap-2">
                            <div className="flex-1 border border-slate-200 rounded bg-slate-50 px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                              <Clock size={12} className="text-slate-400" />
                              {formatDateTime(currentTime)}
                            </div>
                            <div className="flex-1 border border-slate-200 rounded bg-slate-50 px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                              <User size={12} className="text-slate-400" />
                              {currentUser?.name || "Unknown"}
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            onClick={handleSaveCall}
                            disabled={
                              savingCall ||
                              !callSubject.trim() ||
                              !callDescription.trim()
                            }
                            className="w-full gap-2 font-bold justify-center bg-blue-600 py-2.5 disabled:opacity-50"
                          >
                            <Save size={14} />{" "}
                            {savingCall ? "Saving..." : "Save Call"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Create Task Form */}
                    {activeSidebarTab === "Task" && (
                      <div className="p-4">
                        <h4 className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                          <CheckCircle size={14} /> Create a Task
                        </h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Subject <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={taskSubject}
                              onChange={(e) => setTaskSubject(e.target.value)}
                              placeholder="Email follow up, schedule meeting..."
                              className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Priority
                            </label>
                            <select
                              value={taskPriority}
                              onChange={(e) => setTaskPriority(e.target.value)}
                              className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-blue-400"
                            >
                              <option value="LOW">Low</option>
                              <option value="NORMAL">Normal</option>
                              <option value="HIGH">High</option>
                            </select>
                          </div>

                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Due Date
                              </label>
                              <input
                                type="date"
                                value={taskDueDate}
                                onChange={(e) => setTaskDueDate(e.target.value)}
                                className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 focus:outline-none focus:border-blue-400"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                                Due Time
                              </label>
                              <div className="flex items-center justify-center gap-1 w-full border border-slate-200 rounded px-2 py-2 text-[13px] text-slate-800 focus-within:border-blue-400 bg-white">
                                <select
                                  value={taskDueTimeHH}
                                  onChange={(e) => setTaskDueTimeHH(e.target.value)}
                                  className="appearance-none bg-transparent border-none p-0 shadow-none focus:ring-0 focus:outline-none text-center cursor-pointer outline-none w-7"
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                                    const val = h < 10 ? `0${h}` : `${h}`;
                                    return <option key={val} value={val}>{val}</option>;
                                  })}
                                </select>
                                <span className="text-slate-400 font-bold">:</span>
                                <select
                                  value={taskDueTimeMM}
                                  onChange={(e) => setTaskDueTimeMM(e.target.value)}
                                  className="appearance-none bg-transparent border-none p-0 shadow-none focus:ring-0 focus:outline-none text-center cursor-pointer outline-none w-7"
                                >
                                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                                <select
                                  value={taskDueTimeAMPM}
                                  onChange={(e) => setTaskDueTimeAMPM(e.target.value)}
                                  className="appearance-none bg-transparent border-none p-0 shadow-none focus:ring-0 focus:outline-none text-center cursor-pointer text-blue-600 font-bold ml-1 outline-none w-8"
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Task Description
                            </label>
                            <textarea
                              value={taskDescription}
                              onChange={(e) =>
                                setTaskDescription(e.target.value)}
                              placeholder="Any additional details..."
                              rows={3}
                              className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 resize-none"
                            />
                          </div>

                          <div className="flex gap-2">
                            <div className="flex-1 border border-slate-200 rounded bg-slate-50 px-3 py-2 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                              <User size={12} className="text-slate-400" />
                              {currentUser?.name ||
                                currentUser?.user_name ||
                                "Unknown"}
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            onClick={handleSaveTask}
                            disabled={savingTask || !taskSubject.trim()}
                            className="w-full gap-2 font-bold justify-center bg-blue-600 py-2.5 disabled:opacity-50"
                          >
                            <Save size={14} />{" "}
                            {savingTask ? "Saving..." : "Save Task"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Create Email Form */}
                    {activeSidebarTab === "Email" && (
                      <div className="p-4">
                        <h4 className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                          <Mail size={14} /> Send an Email
                        </h4>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              To
                            </label>
                            <input
                              type="email"
                              value={contactData.contact_professional_email || contactData.contact_personal_email || ""}
                              readOnly
                              className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 bg-slate-50"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Subject
                            </label>
                            <input
                              type="text"
                              placeholder="Email subject"
                              className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                              Body
                            </label>
                            <textarea
                              placeholder="Type your email..."
                              rows={4}
                              className="w-full border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 resize-none"
                            />
                          </div>

                          <Button
                            variant="primary"
                            onClick={() => {
                              if (contactData.contact_professional_email) {
                                window.location.href = `mailto:${contactData.contact_professional_email}`;
                              } else if (contactData.contact_personal_email) {
                                window.location.href = `mailto:${contactData.contact_personal_email}`;
                              }
                            }}
                            className="w-full gap-2 font-bold justify-center bg-blue-600 py-2.5"
                          >
                            <Mail size={14} /> Send Email
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* TIMELINE */}
                    <div className="bg-slate-100 py-2.5 px-4 border-y border-slate-200 mt-4 flex items-center gap-2 shrink-0">
                      <Clock size={12} className="text-slate-500" />
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {activeSidebarTab} Timeline
                      </span>
                    </div>
                    <div className="p-4 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {displayedTimeline.map((item) => (
                        <div key={`${item.type}-${item.type === 'call' ? item.call_id : item.task_id}`} className="flex gap-3">
                          
                          {/* Render CALL */}
                          {item.type === "call" ? (
                            <>
                              <div className="w-8 h-8 rounded-full border border-emerald-500 text-emerald-600 flex items-center justify-center shrink-0 bg-white shadow-sm mt-0.5">
                                <Phone size={14} />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-[13px] font-bold text-slate-800 leading-none mb-1.5">
                                  {item.call_subject}
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <User size={12} />{" "}
                                    {item.user?.user_name || "Unknown"}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} />{" "}
                                    {item.call_created_at
                                      ? new Date(item.call_created_at).toLocaleString("en-US", {
                                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                        })
                                      : "Just now"}
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            /* Render TASK */
                            <>
                              <div className="w-8 h-8 rounded-full border border-blue-500 text-blue-600 flex items-center justify-center shrink-0 bg-white shadow-sm mt-0.5">
                                <CheckCircle size={14} />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-[13px] font-bold text-slate-800 leading-none mb-1.5 flex items-center gap-2">
                                  {item.task_subject}
                                  {item.task_priority === "HIGH" && <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">High</span>}
                                  {item.task_priority === "LOW" && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Low</span>}
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <User size={12} />{" "}
                                    {item.user?.user_name || "Unknown"}
                                  </span>
                                  <span >
                                    {item.task_due_date && (
                                      <span className="flex items-center gap-1">
                                        <Clock size={12} />{" "}
                                        {new Date(item.task_due_date).toLocaleString("en-US", {
                                          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                        })}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {displayedTimeline.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-xs font-medium">
                          No {activeSidebarTab.toLowerCase()} timeline events yet.
                        </div>
                      )}
                    </div>
                    
                  </div>
                </div>
              </div>
            )}

            {activeMainTab !== "Details" && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                  <MoreHorizontal className="text-slate-400" size={24} />
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">
                  No {activeMainTab} yet
                </h3>
                <p className="text-xs text-slate-500">
                  There is no {activeMainTab.toLowerCase()} data for this
                  contact.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-slate-500 font-medium">Contact not found.</p>
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

      {addCampaignOpen && (
        <AddCampaignModal
          isOpen={addCampaignOpen}
          onClose={() => setAddCampaignOpen(false)}
          onSuccess={() => setAddCampaignOpen(false)}
          campaignToEdit={null}
        />
      )}

      {editContactOpen && (
        <AddContactModal
          isOpen={editContactOpen}
          onClose={() => setEditContactOpen(false)}
          onSuccess={() => {
            setEditContactOpen(false);
            api.get(`/api/contacts/${contactId}`).then((res) => {
              if (res.success) setContactData(res.data);
            });
          }}
          contactToEdit={contactData}
        />
      )}
    </div>
  );
};

// Helper Components
const GridRow = ({ left, right }) => (
  <div className="flex flex-col md:flex-row border-b border-slate-200 last:border-b-0">
    <div className="flex-1 p-4 md:border-r border-slate-200 flex flex-col justify-center">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {left.label}
      </span>
      <span
        className={`text-[13px] font-semibold flex items-center ${left.isLink ? "text-blue-600 hover:underline cursor-pointer" : "text-slate-700"} ${left.value === "—" ? "text-slate-300" : ""}`}
        onClick={left.onClick}
      >
        {left.value}
        {left.icon && left.icon}
      </span>
    </div>
    <div className="flex-1 p-4 flex flex-col justify-center">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {right.label}
      </span>
      <span
        className={`text-[13px] font-semibold flex items-center ${right.isLink ? "text-blue-600 hover:underline cursor-pointer" : "text-slate-700"} ${right.value === "—" ? "text-slate-300" : ""}`}
        onClick={right.onClick}
      >
        {right.value}
        {right.icon && right.icon}
      </span>
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

export default ConDetailView;
