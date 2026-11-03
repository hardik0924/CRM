import { useState, useEffect } from "react";
import {
  Download, Plus, Search, Edit2, Loader2, Trash2, Megaphone,
} from "lucide-react";
import Button from "../components/ui/Button";
import { api } from "../utils/api";
import { exportCsv } from "../utils/csv";
import AddCampaignModal from "../components/modals/AddCampaignModal";
import toast from "react-hot-toast";

const label = (value) =>
  (value || "-").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const Campaigns = () => {
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [campaignsData, setCampaignsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => fetchCampaigns(), 300);
    return () => clearTimeout(t);
  }, [searchTerm, currentPage]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const query = `?page=${currentPage}&limit=${limit}${
        searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
      }`;
      const response = await api.get(`/api/campaigns${query}`);
      if (response.success) {
        setCampaignsData(response.data);
        setTotalRecords(response.pagination.totalRecords);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      setSelectedRows(campaignsData.map((c) => c.campaign_id));
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
      if (next.length === campaignsData.length) setSelectAll(true);
    }
  };

  const handleDelete = async (campaign) => {
    if (!window.confirm(`Delete campaign "${campaign.campaign_name || "Untitled"}"?`)) return;
    const res = await api.delete(`/api/campaigns/${campaign.campaign_id}`);
    if (res.success) {
      toast.success("Campaign deleted");
      setSelectedRows([]);
      setSelectAll(false);
      fetchCampaigns();
    } else {
      toast.error(res.message || "Could not delete campaign");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedRows.length} selected campaign(s)?`)) return;
    const results = await Promise.all(selectedRows.map((id) => api.delete(`/api/campaigns/${id}`)));
    if (results.every((res) => res.success)) {
      toast.success("Campaigns deleted");
      setSelectedRows([]);
      setSelectAll(false);
      fetchCampaigns();
    } else {
      toast.error("Some campaigns could not be deleted");
      fetchCampaigns();
    }
  };

  return (
    <div className="flex flex-col h-full bg-page-bg animate-fade-in relative overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 surface border-b border-border shrink-0 z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-sidebar text-2xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-secondary text-sm font-medium mt-0.5">
            Run marketing campaigns and track engagement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportCsv("campaigns.csv", campaignsData, [
              { label: "Name", value: (row) => row.campaign_name },
              { label: "Owner", value: (row) => row.user?.user_name },
              { label: "Contacts", value: (row) => row._count?.contacts || 0 },
              { label: "Opportunities", value: (row) => row._count?.opportunities || 0 },
            ])}
            className="gap-2 font-medium text-secondary border border-border"
          >
            <Download size={16} className="text-slate-500" /> Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 font-semibold"
          >
            <Plus size={16} /> New campaign
          </Button>
        </div>
      </div>

      <div className="px-8 py-4 border-b border-border surface flex items-center justify-between shrink-0">
        <div className="relative w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search campaigns&hellip;"
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue"
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
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-vsph-core-blue focus:ring-vsph-core-blue cursor-pointer"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="w-80 min-w-[240px]">Campaign Name</th>
                    <th className="w-48 min-w-[144px]">Owner</th>
                    <th className="w-48 min-w-[144px]">Contacts</th>
                    <th className="w-48 min-w-[144px]">Opportunities</th>
                    <th className="w-24 min-w-[96px] text-center sticky right-0 shadow-[-1px_0_0_rgba(0,0,0,0.05)] z-10">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-surface">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-24 text-center text-secondary">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Loader2 className="animate-spin text-vsph-core-blue" size={28} />
                          <p className="text-sm font-medium">Loading campaigns&hellip;</p>
                        </div>
                      </td>
                    </tr>
                  ) : campaignsData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-24 text-center text-secondary font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Megaphone size={48} className="text-slate-200 mx-auto" />
                          <p>No campaigns found.</p>
                          <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-3 text-xs font-semibold text-vsph-core-blue hover:underline"
                          >
                            Add your first campaign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    campaignsData.map((campaign) => (
                      <tr
                        key={campaign.campaign_id}
                        className={`hover:bg-vsph-light-blue/20 group cursor-pointer transition-colors ${selectedRows.includes(campaign.campaign_id) ? "bg-vsph-light-blue/30" : ""}`}
                      >
                        <td className="border-b border-border px-6 py-4 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-vsph-core-blue focus:ring-vsph-core-blue cursor-pointer"
                            checked={selectedRows.includes(campaign.campaign_id)}
                            onChange={(e) => { e.stopPropagation(); toggleRow(campaign.campaign_id); }}
                          />
                        </td>
                        <td className="border-b border-border px-6 py-4 font-medium text-sidebar hover:underline cursor-pointer truncate group-hover:text-vsph-core-blue"
                          onClick={(e) => { e.stopPropagation(); setCampaignToEdit(campaign); setIsAddModalOpen(true); }}
                        >
                          {campaign.campaign_name || "-"}
                        </td>
                        <td className="border-b border-border px-6 py-4 text-slate-600 truncate">
                          {campaign.user?.user_name || "-"}
                        </td>
                        <td className="border-b border-border px-6 py-4 text-slate-600 truncate">
                          {campaign._count?.contacts || 0}
                        </td>
                        <td className="border-b border-border px-6 py-4 text-slate-600 truncate">
                          {campaign._count?.opportunities || 0}
                        </td>
                        <td className={`px-6 py-4 text-center sticky right-0 group-hover:bg-vsph-light-blue/20 shadow-[-1px_0_0_rgba(0,0,0,0.05)] ${selectedRows.includes(campaign.campaign_id) ? "bg-vsph-light-blue/30" : "bg-surface"}`}>
                          <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              className="btn-icon"
                              title="Edit"
                              onClick={(e) => { e.stopPropagation(); setCampaignToEdit(campaign); setIsAddModalOpen(true); }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="p-2 rounded text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                              title="Delete"
                              onClick={(e) => { e.stopPropagation(); handleDelete(campaign); }}
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

      <AddCampaignModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setCampaignToEdit(null); }}
        onSuccess={fetchCampaigns}
        campaignToEdit={campaignToEdit}
      />
    </div>
  );
};

export default Campaigns;
