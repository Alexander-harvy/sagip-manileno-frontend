import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Bell,
  Shield,
  UserCog,
  MessageSquare,
  Edit3,
  Lock,
  Save,
} from "lucide-react";
import { storage } from "@/utils/storage";

type SettingsTab = "account" | "alerts" | "offline" | "security";

type SettingsState = {
  realTimeAlerts: boolean;
  soundNotification: boolean;
  priorityAlerts: boolean;
  smsFallback: boolean;
};

type AdminUser = {
  admin_id?: number;
  dept_id?: number;
  substation_id?: number | null;
  username?: string;
  email?: string | null;
  first_name?: string;
  last_name?: string;
  contact_no?: string | null;
  role?: string;
};

const API_BASE_URL = "http://localhost:3000/api";


export default function SettingsPage() {
const [searchParams] = useSearchParams();
const defaultTab =
(searchParams.get("tab") as SettingsTab) || "account";
const [activeTab, setActiveTab] =
useState<SettingsTab>(defaultTab);

  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const user = storage.getUser() as AdminUser | null;

  const [form, setForm] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    contactNo: user?.contact_no || "",
  });

  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem("settings");

    if (saved) {
      return JSON.parse(saved);
    }

    return {
      realTimeAlerts: true,
      soundNotification: true,
      priorityAlerts: true,
      smsFallback: true,
    };
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const menuItems = [
    { key: "account", label: "Account Information", icon: UserCog },
    { key: "alerts", label: "Alert Settings", icon: Bell },
    { key: "offline", label: "Offline Settings (SMS)", icon: MessageSquare },
    { key: "security", label: "Security", icon: Shield },
  ] as const;

  const getToken = () => {
    return (
      (storage as any).getToken?.() ||
      localStorage.getItem("token") ||
      localStorage.getItem("adminToken") ||
      ""
    );
  };

  const updateSetting = (key: keyof SettingsState) => {
    const updated = {
      ...settings,
      [key]: !settings[key],
    };

    setSettings(updated);
    localStorage.setItem("settings", JSON.stringify(updated));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveMessage("");

      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/admins/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          contact_no: form.contactNo,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile");
      }

      localStorage.setItem("user", JSON.stringify(result.data));
      localStorage.setItem("settings", JSON.stringify(settings));

      setForm({
        firstName: result.data.first_name || "",
        lastName: result.data.last_name || "",
        email: result.data.email || "",
        contactNo: result.data.contact_no || "",
      });

      setIsEditing(false);
      setSaveMessage("Profile updated successfully.");
    } catch (error: any) {
      setSaveMessage(error.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 2500);
    }
  };

  const handleChangePassword = async () => {
    try {
      const { oldPassword, newPassword, confirmPassword } = passwordForm;

      if (!oldPassword || !newPassword || !confirmPassword) {
        setPasswordError("All fields are required.");
        return;
      }

      if (newPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError("Passwords do not match.");
        return;
      }

      const token = getToken();

      const response = await fetch(`${API_BASE_URL}/admins/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update password");
      }

      setPasswordError("");
      setShowPasswordModal(false);
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setSaveMessage("Password updated successfully.");
      setTimeout(() => setSaveMessage(""), 2500);
    } catch (error: any) {
      setPasswordError(error.message || "Failed to update password.");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-[1400px] rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-8 text-2xl font-semibold text-slate-900">
            Settings
          </h1>

          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            <aside className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={17} />
                    {item.label}
                  </button>
                );
              })}
            </aside>

            <main className="min-h-[280px] space-y-6">
              {activeTab === "account" && (
                <section>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        Account Information
                      </h2>
                      <p className="text-sm text-slate-500">
                        Manage your account details.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditing((prev) => !prev)}
                      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Edit3 size={16} />
                      {isEditing ? "Cancel" : "Edit"}
                    </button>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <InputField
                      label="First Name"
                      value={form.firstName}
                      disabled={!isEditing}
                      onChange={(value) =>
                        setForm({ ...form, firstName: value })
                      }
                    />

                    <InputField
                      label="Last Name"
                      value={form.lastName}
                      disabled={!isEditing}
                      onChange={(value) =>
                        setForm({ ...form, lastName: value })
                      }
                    />

                    <InputField
                      label="Email"
                      value={form.email}
                      disabled={!isEditing}
                      onChange={(value) => setForm({ ...form, email: value })}
                    />

                    <InputField
                      label="Contact Number"
                      value={form.contactNo}
                      disabled={!isEditing}
                      onChange={(value) =>
                        setForm({ ...form, contactNo: value })
                      }
                    />
                  </div>
                </section>
              )}

              {activeTab === "alerts" && (
                <section>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Alert Settings
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Configure emergency alert behavior.
                  </p>

                  <div className="mt-6 space-y-4">
                    <SettingRow
                      title="Real-time Alerts"
                      description="Receive instant alerts when new incidents are reported."
                      enabled={settings.realTimeAlerts}
                      onToggle={() => updateSetting("realTimeAlerts")}
                    />

                    <SettingRow
                      title="Sound Notification"
                      description="Play a sound when critical emergency reports arrive."
                      enabled={settings.soundNotification}
                      onToggle={() => updateSetting("soundNotification")}
                    />

                    <SettingRow
                      title="Priority Alerts"
                      description="Prioritize urgent and pending incidents on the dashboard."
                      enabled={settings.priorityAlerts}
                      onToggle={() => updateSetting("priorityAlerts")}
                    />
                  </div>
                </section>
              )}

              {activeTab === "offline" && (
                <section>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Offline Settings (SMS)
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Configure SMS fallback for emergency alerts when internet is
                    unavailable.
                  </p>

                  <div className="mt-6 space-y-5">
                    <SettingRow
                      title="Enable SMS Fallback"
                      description="Allow emergency alerts to be sent through SMS during offline situations."
                      enabled={settings.smsFallback}
                      onToggle={() => updateSetting("smsFallback")}
                    />

                    <div className="grid gap-5 md:grid-cols-2">
                      <InputField
                        label="SMS Sender ID"
                        value="SAGIP ALERT"
                        disabled
                        onChange={() => {}}
                      />

                      <InputField
                        label="Retry Attempts"
                        value="3 attempts"
                        disabled
                        onChange={() => {}}
                      />
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-700">
                        Emergency Contact Numbers
                      </p>

                      <div className="grid gap-3 md:grid-cols-2">
                        <ContactNumber number="+63 912 345 6789" tag="Primary" />
                        <ContactNumber
                          number="+63 917 111 2233"
                          tag="Secondary"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === "security" && (
                <section>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Security
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage your account password.
                  </p>

                  <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 p-5">
                    <div>
                      <p className="font-medium text-slate-900">
                        Change Password
                      </p>
                      <p className="text-sm text-slate-500">
                        Update your password to keep your account secure.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(true)}
                      className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Lock size={16} />
                      Change
                    </button>
                  </div>
                </section>
              )}

              <div className="flex items-center justify-between pt-6">
                <p
                  className={`text-sm ${
                    saveMessage.toLowerCase().includes("failed")
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {saveMessage}
                </p>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-slate-900">
              Change Password
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Enter your current password and set a new one.
            </p>

            <div className="mt-5 space-y-4">
              <PasswordField
                label="Current Password"
                value={passwordForm.oldPassword}
                onChange={(value) =>
                  setPasswordForm({ ...passwordForm, oldPassword: value })
                }
              />

              <PasswordField
                label="New Password"
                value={passwordForm.newPassword}
                onChange={(value) =>
                  setPasswordForm({ ...passwordForm, newPassword: value })
                }
              />

              <PasswordField
                label="Confirm New Password"
                value={passwordForm.confirmPassword}
                onChange={(value) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: value })
                }
              />

              {passwordError && (
                <p className="text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError("");
                  setPasswordForm({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleChangePassword}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InputField({
  label,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ${
          disabled
            ? "bg-slate-50 text-slate-500"
            : "bg-white text-slate-900 focus:border-slate-500"
        }`}
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
      />
    </div>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition ${
          enabled ? "bg-indigo-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function ContactNumber({ number, tag }: { number: string; tag: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
      <span className="font-medium text-slate-700">{number}</span>
      <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
        {tag}
      </span>
    </div>
  );
}