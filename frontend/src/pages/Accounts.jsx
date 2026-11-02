import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Download, Upload, Plus, Search, Filter, Eye, Edit2, Loader2, Trash2,
} from "lucide-react";
import Button from "../components/ui/Button";
import { api } from "../utils/api";
import AddAccountModal from "../components/modals/AddAccountModal";
import AccountDetailView from "../components/AccDetailView";

const Accounts = () => {
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [accountsData, setAccountsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState(null);
  const [viewAccountId, setViewAccountId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const accountId = searchParams.get("account_id");
    if (accountId) setViewAccountId(accountId);
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => fetchAccounts(), 300);
    return () => clearTimeout(t);
  }, [searchTerm, currentPage]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const query = `?page=${currentPage}&limit=${limit}${
        searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
      }`;
      const response = await api.get(`/api/accounts${query}`);
      if (response.success) {
        setAccountsData(response.data);
        setTotalRecords(response.pagination.totalRecords);
      }
    } catch (error) {
      console.error("Failed to fetch accounts", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      setSelectedRows(accountsData.map((a) => a.account_id));
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
      if (next.length === accountsData.length) setSelectAll(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-vsph-grey animate-fade-in relative overflow-hidden">
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b border-slate-200 shrink-0 z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-vsph-navy text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Total records: {totalRecords}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-2 font-medium text-slate-600 border border-slate-200">
            <Upload size={16} className="text-slate-500" /> Import
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 font-medium text-slate-600 border border-slate-200">
            <Download size={16} className="text-slate-500" /> Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 font-semibold"
          >
            <Plus size={16} /> New account
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
            placeholder="Search accounts&hellip;"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {selectedRows.length > 0 && (
            <span className="text-vsph-navy font-semibold bg-vsph-light-blue/20 px-3 py-1.5 rounded-md border border-vsph-light-blue/30">
              {selectedRows.length} selected
            </span>
          )}
          <Button variant="ghost" size="sm" className="gap-2 font-medium text-slate-600 border border-slate-200">
            <Filter size={16} /> Filters
          </Button>
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
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-48 min-w-[144px]">Account ID</th>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-80 min-w-[240px]">Account name</th>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-48 min-w-[144px]">Employee size</th>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-64 min-w-[192px]">Industry</th>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-48 min-w-[144px]">City</th>
                  <th className="border-b border-slate-200 px-6 py-4 bg-vsph-grey w-24 min-w-[96px] text-center sticky right-0 shadow-[-1px_0_0_rgba(0,0,0,0.05)] z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-vsph-core-blue" size={28} />
                        <p className="text-sm font-medium">Loading accounts&hellip;</p>
                      </div>
                    </td>
                  </tr>
                ) : accountsData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center text-slate-500 font-medium">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  accountsData.map((acc) => (
                    <tr
                      key={acc.account_id}
                      className={`hover:bg-vsph-light-blue/20 group cursor-pointer transition-colors ${selectedRows.includes(acc.account_id) ? "bg-vsph-light-blue/30" : ""}`}
                      onClick={() => setViewAccountId(acc.account_id)}
                    >
                      <td className="border-b border-slate-100 px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-vsph-core-blue focus:ring-vsph-core-blue cursor-pointer"
                          checked={selectedRows.includes(acc.account_id)}
                          onChange={(e) => { e.stopPropagation(); toggleRow(acc.account_id); }}
                        />
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-xs text-slate-500 font-mono truncate">
                        {acc.account_code || "-"}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 font-medium text-vsph-navy hover:underline cursor-pointer truncate group-hover:text-vsph-core-blue">
                        {acc.account_name}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-slate-600 truncate">
                        {acc.account_employees_size || "-"}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-slate-600 truncate">
                        {acc.account_industry || "-"}
                      </td>
                      <td className="border-b border-slate-100 px-6 py-4 text-slate-600 truncate">
                        {acc.account_city || "-"}
                      </td>
                      <td className={`px-6 py-4 text-center sticky right-0 group-hover:bg-vsph-light-blue/20 shadow-[-1px_0_0_rgba(0,0,0,0.05)] ${selectedRows.includes(acc.account_id) ? "bg-vsph-light-blue/30" : "bg-white"}`}>
                        <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 bg-vsph-grey hover:bg-vsph-light-blue/30 rounded text-slate-500 hover:text-vsph-core-blue transition-colors"
                            title="View"
                            onClick={(e) => { e.stopPropagation(); setViewAccountId(acc.account_id); }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="p-2 bg-vsph-grey hover:bg-vsph-light-blue/30 rounded text-slate-500 hover:text-vsph-core-blue transition-colors"
                            title="Edit"
                            onClick={(e) => { e.stopPropagation(); setAccountToEdit(acc); setIsAddModalOpen(true); }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-2 bg-rose-50 hover:bg-rose-100 rounded text-rose-500 hover:text-rose-600 transition-colors"
                            title="Delete"
                            onClick={(e) => { e.stopPropagation(); }}
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

      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setAccountToEdit(null); }}
        onSuccess={fetchAccounts}
        accountToEdit={accountToEdit}
      />
      <AccountDetailView
        isOpen={!!viewAccountId}
        onClose={() => setViewAccountId(null)}
        accountId={viewAccountId}
      />
    </div>
  );
};

export default Accounts;
