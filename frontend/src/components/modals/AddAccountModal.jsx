import React, { useState, useEffect } from "react";
import { X, Loader2, User } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import SearchableSelect from "../ui/SearchableSelect";

import { api } from "../../utils/api";
import { INDUSTRIES } from "../../data/industries";
import toast from "react-hot-toast";
const AddAccountModal = ({ isOpen, onClose, onSuccess, accountToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [accountTypes, setAccountTypes] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const getInputClass = (fieldName) =>
    `w-full px-4 py-2.5 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue transition-all text-sm text-slate-900 placeholder:text-slate-400 ${fieldErrors[fieldName] ? "border-rose-500 focus:ring-rose-500/20 focus:border-rose-500" : ""}`;

  const [formData, setFormData] = useState({
    account_name: "",
    account_type: "",
    account_phone: "",
    account_website: "",
    account_email: "",
    account_city: "",
    account_country: "",
    account_industry: "",
    account_employees_size: "",
    account_description: "",
    account_account_status: "ACTIVE",
    account_annual_revenue: "",

    // Billing
    billing_street: "",
    billing_city: "",
    billing_state: "",
    billing_zip: "",
    billing_country: "",

    // Shipping
    shipping_street: "",
    shipping_city: "",
    shipping_state: "",
    shipping_zip: "",
    shipping_country: "",
  });

  useEffect(() => {
    if (accountToEdit) {
      const billing = accountToEdit.account_billing_address?.[0] || {};
      const shipping = accountToEdit.account_shipping_address?.[0] || {};

      setFormData({
        ...accountToEdit,
        billing_street: billing.billing_street || "",
        billing_city: billing.billing_city || "",
        billing_state: billing.billing_state || "",
        billing_zip: billing.billing_zip || "",
        billing_country: billing.billing_country || "",
        shipping_street: shipping.shipping_street || "",
        shipping_city: shipping.shipping_city || "",
        shipping_state: shipping.shipping_state || "",
        shipping_zip: shipping.shipping_zip || "",
        shipping_country: shipping.shipping_country || "",
      });
      setOwnerId(accountToEdit.account_owner_fk);
    } else {
      setFormData({
        account_name: "",
        account_type: "",
        account_phone: "",
        account_website: "",
        account_email: "",
        account_city: "",
        account_country: "",
        account_industry: "",
        account_employees_size: "",
        account_description: "",
        account_account_status: "ACTIVE",
        account_annual_revenue: "",

        // Billing
        billing_street: "",
        billing_city: "",
        billing_state: "",
        billing_zip: "",
        billing_country: "",

        // Shipping
        shipping_street: "",
        shipping_city: "",
        shipping_state: "",
        shipping_zip: "",
        shipping_country: "",
      });
      setOwnerId("");
    }
  }, [accountToEdit]);

  useEffect(() => {
    const fetchAccountTypes = async () => {
      try {
        const response = await api.get("/api/accounts/types");
        if (response.success) {
          setAccountTypes(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch account types:", err);
      }
    };

    if (isOpen) {
      const userId = localStorage.getItem("vsph_user_id");
      const userName = localStorage.getItem("vsph_user_name");
      if (userId) {
        setOwnerName(userName || "Unknown User");
        setOwnerId(userId);
      }
      fetchAccountTypes();
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
      if (!ownerId) {
        toast.error("User is not logged in.");
        setLoading(false);
        return;
      }

      setFieldErrors({});
      const newErrors = {};

      if (!formData.account_name) {
        newErrors.account_name = true;
      }

      if (
        formData.account_email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.account_email)
      ) {
        newErrors.account_email = true;
      }
      if (
        formData.account_phone &&
        !/^[0-9]{10}$/.test(formData.account_phone)
      ) {
        newErrors.account_phone = true;
      }

      if (Object.keys(newErrors).length > 0) {
        setFieldErrors(newErrors);
        if (newErrors.account_name) toast.error("Account name is required.");
        else if (newErrors.account_type)
          toast.error("Please select an Account Type.");
        else if (newErrors.account_email)
          toast.error("Please enter a valid email address.");
        else if (newErrors.account_phone)
          toast.error("Please enter a valid phone number.");

        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        account_owner_fk: ownerId,
      };

      let response;
      if (accountToEdit) {
        response = await api.put(
          `/api/accounts/${accountToEdit.account_id}`,
          payload,
        );
      } else {
        response = await api.post("/api/accounts", payload);
      }

      if (response.success) {
        toast.success(
          accountToEdit
            ? "Account updated successfully!"
            : "Account created successfully!",
        );
        document.body.style.overflow = "hidden";
        setFieldErrors({});
        onSuccess(); // Refresh the table
        onClose(); // Close the modal
      } else {
        toast.error(
          response.message ||
            (accountToEdit
              ? "Failed to update account"
              : "Failed to create account"),
        );
        setError(response.message || "Failed to create account");
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
      <div className="bg-vsph-light-blue/20 p-1 rounded-full text-vsph-core-blue">
        <User size={14} />
      </div>
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
        Owner:
      </span>
      <span className="text-sm font-bold text-slate-800">{ownerName}</span>
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
        form="add-account-form"
        variant="primary"
        disabled={loading}
        className="min-w-[120px]"
      >
        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
        {loading ? "Saving..." : "Save Account"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={accountToEdit ? "Edit Account" : "Add New Account"}
      widthClass="w-[60vw]"
      headerActions={headerActions}
      footer={footerActions}
    >
      <form id="add-account-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="m-6 mb-0 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-6 p-6">
          {/* Section 2: Account Info */}
          <div className="bg-vsph-grey p-5 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-vsph-core-blue rounded-full"></span>
              Account Information
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    name="account_name"
                    value={formData.account_name}
                    onChange={handleChange}
                    className={getInputClass("account_name")}
                    placeholder="e.g. Google India"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Account Type
                  </label>
                  <SearchableSelect
                    options={accountTypes}
                    value={formData.account_type}
                    onChange={(val) => {
                      setFormData({ ...formData, account_type: val });
                      if (fieldErrors.account_type)
                        setFieldErrors({ ...fieldErrors, account_type: false });
                    }}
                    placeholder="Select Account Type"
                    hasError={fieldErrors.account_type}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="account_email"
                    value={formData.account_email}
                    onChange={handleChange}
                    className={getInputClass("account_email")}
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="account_phone"
                    value={formData.account_phone}
                    onChange={handleChange}
                    className={getInputClass("account_phone")}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Industry
                  </label>
                  <SearchableSelect
                    options={INDUSTRIES}
                    value={formData.account_industry}
                    onChange={(val) =>
                      setFormData({ ...formData, account_industry: val })
                    }
                    placeholder="Select Industry"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    name="account_website"
                    value={formData.account_website}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="www.example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Employee Size
                  </label>
                  <input
                    type="number"
                    name="account_employees_size"
                    value={formData.account_employees_size}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="e.g. 10000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Annual Revenue
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="account_annual_revenue"
                    value={formData.account_annual_revenue}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="e.g. 1500000.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Description
                </label>
                <textarea
                  name="account_description"
                  value={formData.account_description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm resize-none"
                  placeholder="Enter account description..."
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 3: Billing & Shipping */}
          <div className="grid grid-cols-2 gap-6">
            {/* Billing */}
            <div className="bg-vsph-grey p-5 rounded-lg border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-vsph-navy rounded-full"></span>
                Billing Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Street
                  </label>
                  <input
                    type="text"
                    name="billing_street"
                    value={formData.billing_street}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="Street Address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="billing_city"
                      value={formData.billing_city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="billing_state"
                      value={formData.billing_state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                      placeholder="State/Province"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Zip/Postal
                    </label>
                    <input
                      type="text"
                      name="billing_zip"
                      value={formData.billing_zip}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                      placeholder="Zip Code"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="billing_country"
                      value={formData.billing_country}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-vsph-grey p-5 rounded-lg border border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                Shipping Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Street
                  </label>
                  <input
                    type="text"
                    name="shipping_street"
                    value={formData.shipping_street}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="Street Address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="shipping_city"
                      value={formData.shipping_city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="shipping_state"
                      value={formData.shipping_state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                      placeholder="State/Province"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Zip/Postal
                    </label>
                    <input
                      type="text"
                      name="shipping_zip"
                      value={formData.shipping_zip}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                      placeholder="Zip Code"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      name="shipping_country"
                      value={formData.shipping_country}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddAccountModal;
