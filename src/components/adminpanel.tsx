"use client";

import { BulkUserUpload } from "@/components/bulkuserupload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, inputClass } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import type { NewUserInput, PricingConfig, User, UserRole, UserStatus } from "@/types";
import {
  CheckCircle2,
  Download,
  IndianRupee,
  Save,
  Search,
  Shield,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";

interface AdminPanelProps {
  users: User[];
  pricingConfig: PricingConfig;
  onUpdateRole: (id: string, role: UserRole) => void;
  onUpdateStatus: (id: string, status: UserStatus) => void;
  onDeleteUser: (id: string) => void;
  onAddUser: (user: NewUserInput) => void;
  onBulkUpload: (users: NewUserInput[]) => void;
  onSavePricing: (config: PricingConfig) => void;
}

type AdminTab = "pricing" | "users";
type UserFilter = "ALL" | "REPRO_DEPT" | "MIS_MONITORS" | "REQUESTORS";

export function AdminPanel({
  users,
  pricingConfig,
  onUpdateRole,
  onUpdateStatus,
  onDeleteUser,
  onAddUser,
  onBulkUpload,
  onSavePricing,
}: AdminPanelProps) {
  const [tab, setTab] = useState<AdminTab>("pricing");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<UserFilter>("ALL");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bw, setBw] = useState(pricingConfig.bwPricePerPage);
  const [color, setColor] = useState(pricingConfig.colorPricePerPage);
  const [a3Bw, setA3Bw] = useState(pricingConfig.a3BwPricePerPage);
  const [a3Color, setA3Color] = useState(pricingConfig.a3ColorPricePerPage);
  const [facultyExemption, setFacultyExemption] = useState(pricingConfig.facultyExemption);
  const [staffExemption, setStaffExemption] = useState(pricingConfig.staffExemption);
  const [domains, setDomains] = useState(pricingConfig.allowedDomains.join(", "));
  const [upiVpa, setUpiVpa] = useState(pricingConfig.upiVpa);
  const [upiPayeeName] = useState(pricingConfig.upiPayeeName);
  const [gdriveFolderName] = useState(pricingConfig.gdriveFolderName);
  const [gdriveFolderId] = useState(pricingConfig.gdriveFolderId);
  const [saved, setSaved] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("STUDENT");
  const [newDept, setNewDept] = useState("");
  const [newId, setNewId] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = users.filter((user) => {
    if (filter === "REPRO_DEPT") {
      if (user.role !== "REPRO_STAFF" && user.role !== "REPRO_MANAGER") return false;
    } else if (filter === "MIS_MONITORS") {
      if (
        user.role !== "MIS_MONITOR" &&
        user.role !== "DEPT_HEAD" &&
        user.role !== "SUPER_ADMIN"
      )
        return false;
    } else if (
      filter === "REQUESTORS" &&
      user.role !== "STUDENT" &&
      user.role !== "FACULTY" &&
      user.role !== "STAFF"
    ) {
      return false;
    }
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q) ||
      (user.department && user.department.toLowerCase().includes(q)) ||
      (user.employeeOrStudentId && user.employeeOrStudentId.toLowerCase().includes(q))
    );
  });

  const toggleClass =
    "w-11 h-6 bg-flame-ivory peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-flame-orange border border-flame-blue/15";

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-flame-orange/10 text-flame-orange border border-flame-orange/20">
              <Shield className="w-5 h-5" />
            </span>
            <h2 className="font-display text-xl font-bold text-flame-blue tracking-tight">
              Enterprise Database & System Control
            </h2>
          </div>
          <p className="text-xs text-flame-muted mt-1 font-medium">
            Manage Reprographics staff, MIS monitoring roles, user status, pricing
            configurations, and Google SSO rules.
          </p>
        </div>
        <Segmented<AdminTab>
          value={tab}
          onChange={setTab}
          options={[
            {
              id: "pricing",
              label: (
                <span className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Pricing & System Config
                </span>
              ),
            },
            {
              id: "users",
              label: (
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> User Database ({users.length})
                </span>
              ),
            },
          ]}
        />
      </Card>

      {tab === "pricing" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            domains.split(",").map((d) => d.trim().replace(/^@/, "")).filter(Boolean);
            onSavePricing({
              ...pricingConfig,
              bwPricePerPage: Number(bw),
              colorPricePerPage: Number(color),
              a3BwPricePerPage: Number(a3Bw),
              a3ColorPricePerPage: Number(a3Color),
              facultyExemption,
              staffExemption,
              allowedDomains: domains.split(",").map((d) => d.trim()).filter(Boolean),
              upiVpa: upiVpa.trim(),
              upiPayeeName: upiPayeeName.trim(),
              gdriveFolderName: gdriveFolderName.trim(),
              gdriveFolderId: gdriveFolderId.trim(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
          }}
          className="bg-flame-paper border border-flame-blue/10 rounded-2xl p-5 sm:p-8 shadow-sm space-y-8"
        >
          {saved && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Pricing configurations updated successfully across system!
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-flame-blue mb-4 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-flame-orange" />
              Dynamic Per-Page Print Rates (Students)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "B&W Per-Page Price — A4 (₹)",
                  value: bw,
                  set: setBw,
                  step: "0.25",
                  hint: "Base rate applied per printable B&W page.",
                },
                {
                  label: "Color Per-Page Price — A4 (₹)",
                  value: color,
                  set: setColor,
                  step: "0.5",
                  hint: "Base rate per A4 Color page.",
                },
                {
                  label: "B&W Per-Page Price — A3 (₹)",
                  value: a3Bw,
                  set: setA3Bw,
                  step: "0.25",
                  hint: "Base rate per A3 B&W page.",
                },
                {
                  label: "Color Per-Page Price — A3 (₹)",
                  value: a3Color,
                  set: setA3Color,
                  step: "0.5",
                  hint: "Base rate per A3 Color page.",
                },
              ].map((field) => (
                <div
                  key={field.label}
                  className="bg-flame-ivory p-4 rounded-2xl border border-flame-blue/10 space-y-2"
                >
                  <label className="text-xs font-bold text-flame-ink block">
                    {field.label}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-flame-muted">₹</span>
                    <input
                      type="number"
                      step={field.step}
                      min="0"
                      value={field.value}
                      onChange={(event) => field.set(Number(event.target.value))}
                      className={cn(inputClass, "font-extrabold bg-flame-paper")}
                    />
                  </div>
                  <p className="text-[11px] text-flame-muted">{field.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-flame-blue mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Role Exemption Controls (₹0.00 Auto-Applied)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Faculty Exemption Toggle",
                  hint: "Auto-applies ₹0.00 rate for Faculty jobs",
                  checked: facultyExemption,
                  onChange: setFacultyExemption,
                },
                {
                  title: "Staff Exemption Toggle",
                  hint: "Auto-applies ₹0.00 rate for Staff jobs",
                  checked: staffExemption,
                  onChange: setStaffExemption,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-flame-ivory p-4 rounded-2xl border border-flame-blue/10 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-bold text-flame-ink text-xs">{item.title}</h4>
                    <p className="text-[11px] text-flame-muted">{item.hint}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(event) => item.onChange(event.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={toggleClass} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-flame-ivory p-4 rounded-2xl border border-flame-blue/10 space-y-3">
              <label className="text-xs font-bold text-flame-ink">Allowed Email SSO Domains</label>
              <input
                type="text"
                value={domains}
                onChange={(event) => setDomains(event.target.value)}
                placeholder="e.g. university.edu, flame.edu.in"
                className={cn(inputClass, "font-mono bg-flame-paper")}
              />
              <p className="text-[11px] text-flame-muted">
                Comma-separated email domains permitted for Google SSO login.
              </p>
            </div>
            <div className="bg-flame-ivory p-4 rounded-2xl border border-flame-blue/10 space-y-3">
              <label className="text-xs font-bold text-flame-ink">
                Reprographics UPI Payee VPA
              </label>
              <input
                type="text"
                value={upiVpa}
                onChange={(event) => setUpiVpa(event.target.value)}
                placeholder="reprographics@flamebank"
                className={cn(inputClass, "font-mono bg-flame-paper")}
              />
              <p className="text-[11px] text-flame-muted">
                UPI Virtual Payment Address encoded into checkout QR codes.
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Save className="w-4 h-4" />
            Save & Apply Pricing Configurations
          </Button>
        </form>
      )}

      {tab === "users" && (
        <Card className="p-5 sm:p-8 space-y-6">
          <div className="flex flex-col gap-4 border-b border-flame-blue/10 pb-4">
            <div className="flex flex-wrap items-center gap-1.5 bg-flame-ivory p-1.5 rounded-2xl border border-flame-blue/10">
              {(
                [
                  { id: "ALL", label: `All Users (${users.length})` },
                  {
                    id: "REPRO_DEPT",
                    label: `Repro Dept Members (${users.filter((u) => u.role === "REPRO_STAFF" || u.role === "REPRO_MANAGER").length})`,
                  },
                  {
                    id: "MIS_MONITORS",
                    label: `MIS & Executive Monitors (${users.filter((u) => u.role === "MIS_MONITOR" || u.role === "DEPT_HEAD" || u.role === "SUPER_ADMIN").length})`,
                  },
                  {
                    id: "REQUESTORS",
                    label: `Print Requestors (${users.filter((u) => u.role === "STUDENT" || u.role === "FACULTY" || u.role === "STAFF").length})`,
                  },
                ] as { id: UserFilter; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "px-3 min-h-11 rounded-xl text-xs font-bold",
                    filter === item.id
                      ? "bg-flame-orange text-white"
                      : "text-flame-muted hover:text-flame-ink",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => {
                  const href =
                    "data:text/json;charset=utf-8," +
                    encodeURIComponent(JSON.stringify(users, null, 2));
                  const link = document.createElement("a");
                  link.setAttribute("href", href);
                  link.setAttribute(
                    "download",
                    `flame_repro_user_database_${new Date().toISOString().split("T")[0]}.json`,
                  );
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                }}
              >
                <Download className="w-4 h-4 text-flame-blue" />
                Export DB (JSON)
              </Button>
              <Button variant="accent" onClick={() => setBulkOpen(true)}>
                <Upload className="w-4 h-4" />
                Bulk CSV Upload
              </Button>
              <Button onClick={() => setAddOpen(true)}>
                <UserPlus className="w-4 h-4" />
                Add User Profile
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-flame-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user database by Name, Email, Student/Employee ID, or Department..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={cn(inputClass, "pl-10")}
            />
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((user) => (
              <div key={user.id} className="bg-flame-ivory rounded-2xl p-4 space-y-3 border border-flame-blue/10">
                <div className="flex items-center gap-2.5">
                  <img
                    src={
                      user.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                    }
                    alt={user.name}
                    className="w-9 h-9 rounded-xl object-cover border border-flame-blue/15"
                  />
                  <div>
                    <div className="font-bold text-flame-ink text-xs">{user.name}</div>
                    <div className="text-[11px] text-flame-muted font-mono">{user.email}</div>
                  </div>
                </div>
                <select
                  value={user.role}
                  onChange={(event) => onUpdateRole(user.id, event.target.value as UserRole)}
                  className={inputClass}
                >
                  {roleOptions()}
                </select>
                <select
                  value={user.status || "ACTIVE"}
                  onChange={(event) =>
                    onUpdateStatus(user.id, event.target.value as UserStatus)
                  }
                  className={inputClass}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
                <button
                  type="button"
                  onClick={() => onDeleteUser(user.id)}
                  className="min-h-11 w-full rounded-lg text-rose-600 bg-rose-50 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto rounded-2xl border border-flame-blue/10 bg-flame-ivory">
            <table className="w-full text-left text-xs text-flame-ink">
              <thead className="bg-flame-paper text-[10px] uppercase font-bold text-flame-muted border-b border-flame-blue/10">
                <tr>
                  <th className="p-3.5">User Details</th>
                  <th className="p-3.5">ID & Contact</th>
                  <th className="p-3.5">Role Category</th>
                  <th className="p-3.5">Account Status</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-flame-blue/10">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-flame-paper/80">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            user.avatarUrl ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                          }
                          alt={user.name}
                          className="w-9 h-9 rounded-xl object-cover border border-flame-blue/15"
                        />
                        <div>
                          <div className="font-bold text-xs">{user.name}</div>
                          <div className="text-[11px] text-flame-muted font-mono">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-flame-muted font-mono text-[11px]">
                      <div>{user.employeeOrStudentId || "N/A"}</div>
                      <div className="text-[10px]">{user.phone || "No phone"}</div>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={user.role}
                        onChange={(event) =>
                          onUpdateRole(user.id, event.target.value as UserRole)
                        }
                        className="bg-flame-paper border border-flame-blue/15 rounded-xl px-2.5 py-1 text-xs font-bold text-flame-blue"
                      >
                        {roleOptions()}
                      </select>
                    </td>
                    <td className="p-3.5">
                      <select
                        value={user.status || "ACTIVE"}
                        onChange={(event) =>
                          onUpdateStatus(user.id, event.target.value as UserStatus)
                        }
                        className={cn(
                          "rounded-xl px-2.5 py-1 text-[11px] font-extrabold border",
                          (user.status || "ACTIVE") === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200",
                        )}
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-flame-muted">
                      {user.department || "General University"}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteUser(user.id)}
                        className="p-2 min-h-11 min-w-11 rounded-lg text-flame-muted hover:text-rose-600 hover:bg-rose-50"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {bulkOpen && (
        <BulkUserUpload onBulkUpload={onBulkUpload} onClose={() => setBulkOpen(false)} />
      )}

      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add User Profile to Database"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!newName.trim() || !newEmail.trim()) return;
            onAddUser({
              name: newName.trim(),
              email: newEmail.trim(),
              role: newRole,
              department: newDept.trim() || "General University",
              employeeOrStudentId:
                newId.trim() || `ID-${Math.floor(1000 + 9000 * Math.random())}`,
              phone: newPhone.trim() || undefined,
              status: "ACTIVE",
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newEmail.trim())}`,
            });
            setNewName("");
            setNewEmail("");
            setNewDept("");
            setNewId("");
            setNewPhone("");
            setAddOpen(false);
          }}
          className="p-6 space-y-3"
        >
          <Field label="Full Name">
            <input
              type="text"
              required
              placeholder="e.g. Priyanshu Mehta"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email Address">
            <input
              type="email"
              required
              placeholder="e.g. p.mehta@university.edu"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Student / Employee ID">
              <input
                type="text"
                placeholder="e.g. FL2026-CS001"
                value={newId}
                onChange={(event) => setNewId(event.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Phone Number">
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={newPhone}
                onChange={(event) => setNewPhone(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="User Role Category">
            <select
              value={newRole}
              onChange={(event) => setNewRole(event.target.value as UserRole)}
              className={inputClass}
            >
              {roleOptions()}
            </select>
          </Field>
          <Field label="Department">
            <input
              type="text"
              placeholder="e.g. School of Business"
              value={newDept}
              onChange={(event) => setNewDept(event.target.value)}
              className={inputClass}
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save User Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function roleOptions() {
  return (
    <>
      <optgroup label="Print Requestors">
        <option value="STUDENT">Student (UPI Billed)</option>
        <option value="FACULTY">Faculty (₹0.00 Exempt)</option>
        <option value="STAFF">Staff (₹0.00 Exempt)</option>
      </optgroup>
      <optgroup label="Reprographics Department">
        <option value="REPRO_STAFF">Repro Staff (Operator)</option>
        <option value="REPRO_MANAGER">Repro Manager (Supervisor)</option>
      </optgroup>
      <optgroup label="MIS & Monitoring Roles">
        <option value="MIS_MONITOR">MIS Monitor (Auditor)</option>
        <option value="DEPT_HEAD">Department Head (Executive)</option>
        <option value="SUPER_ADMIN">Super Administrator</option>
      </optgroup>
    </>
  );
}
