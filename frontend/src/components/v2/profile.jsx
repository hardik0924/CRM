import { useEffect, useState } from "react";
import { Check, RotateCcw, UserRound } from "lucide-react";
import { avatarColorHex, initialsOf, readProfile, saveProfile } from "../../utils/profile";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
];

const COLORS = [
  { key: "navy", label: "Navy" },
  { key: "blue", label: "Blue" },
  { key: "slate", label: "Slate" },
];

const FIELD = "w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-vsph-core-blue focus:border-vsph-core-blue";

const ProfileV2 = () => {
  const [saved, setSaved] = useState(readProfile);
  const [form, setForm] = useState(readProfile);
  const [notice, setNotice] = useState("");

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const submit = (event) => {
    event.preventDefault();
    const name = form.name.trim() || saved.name;
    saveProfile({ name, about: form.about, timezone: form.timezone, color: form.color });
    const next = readProfile();
    setSaved(next);
    setForm(next);
    setNotice("Profile saved");
  };

  const reload = () => {
    const next = readProfile();
    setSaved(next);
    setForm(next);
    setNotice("Reloaded saved details");
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-vsph-core-blue">
          Your account
        </p>
        <h1 className="text-2xl font-bold text-sidebar mt-1">Your profile</h1>
        <p className="text-sm text-secondary mt-1">
          Update how your name and avatar appear across the CRM.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        <div className="card border-border p-6 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold"
            style={{ backgroundColor: avatarColorHex(form.color) }}
          >
            {initialsOf(form.name)}
          </div>
          <p className="mt-4 text-lg font-bold text-sidebar truncate">{form.name || saved.name}</p>
          <p className="text-sm text-secondary">{saved.roleLabel}</p>
          {saved.email && (
            <p className="text-xs text-slate-400 mt-1 truncate">{saved.email}</p>
          )}
          <div className="mt-5 border-t border-border pt-4 flex items-center justify-center gap-2 text-[11px] text-secondary">
            <UserRound size={14} />
            {saved.timezone}
          </div>
        </div>

        <form onSubmit={submit} className="card border-border p-6">
          <h2 className="font-bold text-sidebar">Personal details</h2>
          <p className="text-xs text-secondary mt-1">
            These details are shown to teammates in activity and assignments.
          </p>

          <div className="mt-5 space-y-5">
            <div>
              <label htmlFor="display-name" className="block text-xs font-semibold text-sidebar mb-1.5">
                Display name
              </label>
              <input
                id="display-name"
                type="text"
                value={form.name}
                onChange={update("name")}
                maxLength={80}
                className={FIELD}
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="about" className="block text-xs font-semibold text-sidebar mb-1.5">
                About you
              </label>
              <textarea
                id="about"
                value={form.about}
                onChange={update("about")}
                rows={4}
                maxLength={400}
                className={`${FIELD} resize-none`}
                placeholder="A short line about your role or focus"
              />
              <p className="text-[10px] text-slate-400 mt-1">{form.about.length}/400</p>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-xs font-semibold text-sidebar mb-1.5">
                Time zone
              </label>
              <select
                id="timezone"
                value={form.timezone}
                onChange={update("timezone")}
                className={FIELD}
              >
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-sidebar mb-2">Avatar color</span>
              <div className="flex flex-wrap gap-3">
                {COLORS.map((color) => (
                  <label
                    key={color.key}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm ${
                      form.color === color.key
                        ? "border-vsph-core-blue bg-vsph-core-blue/5 text-sidebar font-semibold"
                        : "border-border text-slate-600 hover:border-vsph-core-blue/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="avatar-color"
                      value={color.key}
                      checked={form.color === color.key}
                      onChange={update("color")}
                      className="sr-only"
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: avatarColorHex(color.key) }}
                    />
                    {color.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
            <button
              type="submit"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-vsph-core-blue text-white text-sm font-semibold hover:bg-vsph-navy transition-colors"
            >
              <Check size={16} /> Save profile
            </button>
            <button
              type="button"
              onClick={reload}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-white text-sm font-semibold text-slate-600 hover:text-vsph-core-blue"
            >
              <RotateCcw size={16} /> Reload saved details
            </button>
            {notice && (
              <span className="text-xs font-semibold text-emerald-600">{notice}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileV2;
