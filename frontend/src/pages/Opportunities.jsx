import { useState, useEffect } from "react";
import {
  Download, Plus, Search, Filter, Edit2, Loader2, Trash2,
} from "lucide-react";
import Button from "../components/ui/Button";
import { api } from "../utils/api";
import { exportCsv } from "../utils/csv";
import AddOpportunityModal from "../components/modals/AddOpportunityModal";
import toast from "react-hot-toast";

const Opportunities = () => {
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [opportunitiesData, setOpportunitiesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [opportunityToEdit, setOpportunityToEdit] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => fetchOpportunities(), 300);
    return () => clearTimeout(t);
  }, [searchTerm, currentPage, stageFilter]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const query = `?page=${currentPage}&limit=${limit}${
        searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
      }${stageFilter !== "All stages" ? `&stage=${stageFilter}` : ""}`;
      const response = await api.get(`/api/opportunities${query}`);
      if (response.success) {
        setOpportunitiesData(response.data);
        setTotalRecords(response.pagination.totalRecords);
      }
    } catch (error) {
      console.error("Failed to fetch opportunities", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (opportunity) => {
    if (!window.confirm(`Delete opportunity "${opportunity.opportunity_name}"?`)) return;
    const res = await api.delete(`/api/opportunities/${opportunity.opportunity_id}`);
    if (res.success) {
      toast.success("Opportunity deleted");
      fetchOpportunities();
    } else {
      toast.error(res.message || "Could not delete opportunity");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedRows.length} selected opportunity(ies)?`)) return;
    const results = await Promise.all(selectedRows.map((id) => api.delete(`/api/opportunities/${id}`)));
    if (results.every((res) => res.success)) {
      toast.success("Opportunities deleted");
      setSelectedRows([]);
      setSelectAll(false);
      fetchOpportunities();
    } else {
      toast.error("Some opportunities could not be deleted");
      fetchOpportunities();
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      setSelectedRows(opportunitiesData.map((o) => o.opportunity_id));
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
      if (next.length === opportunitiesData.length) setSelectAll(true);
    }
  };

  const STAGE_COLORS = {
    PITCH_DONE: "bg-vsph-light-blue/20 text-vsph-core-blue",
    FOLLOW_UP: "bg-vsph-grey text-vsph-navy",
    CONTRACT_OUT: "bg-amber-50 text-amber-700",
    CLOSED_WON: "bg-emerald-50 text-emerald-700",
    CLOSED_LOST: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="flex flex-col h-full bg-vsph-grey animate-fade-in relative overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 shrink-0 z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-vsph-navy text-2xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Total records: {totalRecords}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportCsv("opportunities.csv", opportunitiesData, [
              { label: "Name", value: (row) => row.opportunity_name },
              { label: "Stage", value: (row) => row.opportunity_stage },
              { label: "Close date", value: (row) => row.opportunity_close_date && new Date(row.opportunity_close_date).toLocaleDateString() },
              { label: "Owner", value: (row) => row.opportunity_owner?.user_name },
              { label: "Account", value: (row) => row.opportunity_account?.account_name },
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
            <Plus size={16} /> New opportunity
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
            placeholder="Search opportunities&hellip;"
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
          <div className="relative">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white focus:ring-2 focus:ring-vsph-core-blue"
            >
              <option value="All stages">All stages</option>
              <option value="PITCH_DONE">Pitch done</option>
              <option value="FOLLOW_UP">Follow up</option>
              <option value="CONTRACT_OUT">Contract out</option>
              <option value="CLOSED_WON">Closed won</option>
              <option value="CLOSED_LOST">Closed lost</option>
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
              <Filter size={16} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        <div className="card flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm border-collapse" style={{ tableLayout: "fixed" }}>
              <thead className="sticky top-0 z-10 bg-vsph-grey shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <tr>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-10 min-w-[44px] max-w-[44px] text-center z-10">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-vsph-core-blue focus:ring-vsph-core-blue cursor-pointer"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-80 min-w-[240px]">Opportunity</th>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-48 min-w-[144px]">Stage</th>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-40 min-w-[120px]">Close date</th>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-56 min-w-[168px]">Owner</th>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-24 min-w-[96px] text-center sticky right-0 shadow-[-1px_0_0_rgba(0,0,0,0.05)] z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-vsph-core-blue" size={28} />
                        <p className="text-sm font-medium">Loading opportunities&hellip;</p>
                      </div>
                    </td>
                  </tr>
                ) : opportunitiesData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-16 text-center text-slate-500 font-medium">
                      No opportunities found.
                    </td>
                  </tr>
                ) : (
                  opportunitiesData.map((opp) => (
                    <tr
                      key={opp.opportunity_id}
                      className={`hover:bg-vsph-light-blue/20 group transition-colors ${selectedRows.includes(opp.opportunity_id) ? "bg-vsph-light-blue/30" : ""}`}
                    >
                      <td className="border-b border-slate-100 px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-vsph-core-blue focus:ring-vsph-core-blue cursor-pointer"
                          checked={selectedRows.includes(opp.opportunity_id)}
                          onChange={(e) => { e.stopPropagation(); toggleRow(opp.opportunity_id); }}
                        />
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 font-medium text-vsph-navy hover:underline cursor-pointer truncate group-hover:text-vsph-core-blue">
                        {opp.opportunity_name}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${STAGE_COLORS[opp.opportunity_stage] || "bg-vsph-grey text-slate-600"}`}>
                          {opp.opportunity_stage?.replace(/_/g, " ") || "-"}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-slate-600 truncate">
                        {opp.opportunity_close_date ? new Date(opp.opportunity_close_date).toLocaleDateString() : "-"}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-slate-600 truncate">
                        {opp.opportunity_owner?.user_name || "-"}
                      </td>
                      <td className={`px-6 py-4 text-center sticky right-0 group-hover:bg-vsph-light-blue/20 shadow-[-1px_0_0_rgba(0,0,0,0.05)] ${selectedRows.includes(opp.opportunity_id) ? "bg-vsph-light-blue/30" : "bg-white"}`}>
                        <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 bg-vsph-grey hover:bg-vsph-light-blue/30 rounded text-slate-500 hover:text-vsph-core-blue transition-colors"
                            title="Edit"
                            onClick={(e) => { e.stopPropagation(); setOpportunityToEdit(opp); setIsAddModalOpen(true); }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-2 bg-rose-50 hover:bg-rose-100 rounded text-rose-500 hover:text-rose-600 transition-colors"
                            title="Delete"
                            onClick={(e) => { e.stopPropagation(); handleDelete(opp); }}
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

      <AddOpportunityModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setOpportunityToEdit(null); }}
        onSuccess={fetchOpportunities}
        opportunityToEdit={opportunityToEdit}
      />
    </div>
  );
};

export default Opportunities;
