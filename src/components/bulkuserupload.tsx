"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { inputClass } from "@/components/ui/field";
import type { NewUserInput, UserRole } from "@/types";
import { AlertCircle, CheckCircle2, Upload, Users } from "lucide-react";
import { useState } from "react";

interface BulkUserUploadProps {
  onBulkUpload: (users: NewUserInput[]) => void;
  onClose: () => void;
}

function parseRole(raw: string): UserRole {
  const value = raw.toUpperCase();
  if (value.includes("FACULTY")) return "FACULTY";
  if (value.includes("STAFF") && !value.includes("REPRO")) return "STAFF";
  if (value.includes("REPRO_MGR") || value.includes("REPRO MANAGER")) return "REPRO_MANAGER";
  if (value.includes("REPRO")) return "REPRO_STAFF";
  if (value.includes("MIS") || value.includes("AUDIT")) return "MIS_MONITOR";
  if (value.includes("DEAN") || value.includes("HEAD")) return "DEPT_HEAD";
  if (value.includes("ADMIN")) return "SUPER_ADMIN";
  return "STUDENT";
}

export function BulkUserUpload({ onBulkUpload, onClose }: BulkUserUploadProps) {
  const [csv, setCsv] = useState("");
  const [parsed, setParsed] = useState<NewUserInput[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parseCsv = (content: string) => {
    setError(null);
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length <= 1) {
      setError("CSV content must contain a header line and at least 1 data row.");
      setParsed([]);
      return;
    }
    const users: NewUserInput[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((col) => col.trim());
      if (cols.length >= 2) {
        const name = cols[0];
        const email = cols[1];
        const role = parseRole(cols[2] || "STUDENT");
        const department = cols[3] || "General Department";
        users.push({
          name,
          email,
          role,
          department,
          status: "ACTIVE",
          employeeOrStudentId: `BULK-${Math.floor(1000 + 9000 * Math.random())}`,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
        });
      }
    }
    setParsed(users);
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      wide
      title="Bulk Upload User Categories"
      subtitle="Import users & assign roles via CSV/Excel"
      icon={
        <div className="w-9 h-9 rounded-xl bg-white/10 text-flame-gold border border-white/20 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
      }
    >
      <div className="p-6 space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-flame-ink">
              Paste CSV Data or Choose File (.csv)
            </label>
            <button
              type="button"
              onClick={() => {
                const sample =
                  "Name,Email,Role,Department\nRahul Verma,rahul.v@university.edu,STUDENT,Computer Science\nProf. Sunita Rao,sunita.rao@university.edu,FACULTY,Physics & Astronomy\nKaran Malhotra,karan.m@university.edu,STAFF,Admissions Office\nNeha Gupta,neha.g@university.edu,STUDENT,Design & Art";
                setCsv(sample);
                parseCsv(sample);
              }}
              className="text-[11px] text-flame-orange hover:underline font-semibold"
            >
              Load Sample Template
            </button>
          </div>
          <textarea
            rows={5}
            placeholder="Name,Email,Role,Department"
            value={csv}
            onChange={(event) => {
              setCsv(event.target.value);
              parseCsv(event.target.value);
            }}
            className={`${inputClass} font-mono`}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 px-4 min-h-11 bg-flame-blue hover:bg-flame-blue-deep text-white rounded-xl text-xs font-semibold cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload CSV File
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(event) => {
                  if (event.target.files?.[0]) {
                    const file = event.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (loadEvent) => {
                      const text = String(loadEvent.target?.result || "");
                      setCsv(text);
                      parseCsv(text);
                    };
                    reader.readAsText(file);
                  }
                }}
                className="hidden"
              />
            </label>
            <span className="text-xs text-flame-muted">
              Format: Name, Email, Role, Department
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {parsed.length > 0 && (
          <div className="space-y-2 border-t border-flame-blue/10 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-flame-ink">
                Parsed Users Preview ({parsed.length})
              </span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Validated
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-2xl border border-flame-blue/10 bg-flame-ivory">
              <div className="md:hidden space-y-2 p-2">
                {parsed.map((user, index) => (
                  <div key={index} className="bg-flame-paper rounded-xl p-3 text-xs">
                    <p className="font-semibold text-flame-ink">{user.name}</p>
                    <p className="font-mono text-flame-muted">{user.email}</p>
                    <p className="font-bold text-flame-blue">{user.role}</p>
                  </div>
                ))}
              </div>
              <table className="hidden md:table w-full text-left text-xs text-flame-ink">
                <thead className="bg-flame-paper text-[10px] uppercase font-bold text-flame-muted sticky top-0">
                  <tr>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Role</th>
                    <th className="p-2.5">Department</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-flame-blue/10">
                  {parsed.map((user, index) => (
                    <tr key={index}>
                      <td className="p-2.5 font-semibold">{user.name}</td>
                      <td className="p-2.5 text-flame-muted font-mono">{user.email}</td>
                      <td className="p-2.5 font-bold text-flame-blue">{user.role}</td>
                      <td className="p-2.5 text-flame-muted">{user.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-flame-ivory border-t border-flame-blue/10 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="accent"
          disabled={parsed.length === 0}
          onClick={() => {
            if (parsed.length === 0) return;
            onBulkUpload(parsed);
            onClose();
          }}
        >
          Import {parsed.length} User(s) Now
        </Button>
      </div>
    </Modal>
  );
}
