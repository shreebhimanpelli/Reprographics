import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@/types";

export function RoleBanner({ role }: { role: UserRole }) {
  switch (role) {
    case "STUDENT":
      return <Badge tone="blue">Student</Badge>;
    case "FACULTY":
      return <Badge tone="emerald">Faculty (₹0.00)</Badge>;
    case "STAFF":
      return <Badge tone="purple">Staff (₹0.00)</Badge>;
    case "REPRO_STAFF":
      return <Badge tone="amber">Repro Staff</Badge>;
    case "REPRO_MANAGER":
      return <Badge tone="gold">Repro Manager</Badge>;
    case "MIS_MONITOR":
      return <Badge tone="cyan">MIS Auditor</Badge>;
    case "DEPT_HEAD":
      return <Badge tone="teal">Dept Head / Dean</Badge>;
    case "SUPER_ADMIN":
      return <Badge tone="rose">Super Admin</Badge>;
    default:
      return <Badge tone="muted">{role}</Badge>;
  }
}

export function canSeeQueue(role?: UserRole) {
  return (
    role === "REPRO_STAFF" ||
    role === "REPRO_MANAGER" ||
    role === "SUPER_ADMIN"
  );
}

export function canSeeAnalytics(role?: UserRole) {
  return (
    role === "MIS_MONITOR" ||
    role === "DEPT_HEAD" ||
    role === "REPRO_MANAGER" ||
    role === "SUPER_ADMIN" ||
    role === "REPRO_STAFF"
  );
}

export function canSeeAdmin(role?: UserRole) {
  return role === "SUPER_ADMIN" || role === "REPRO_MANAGER";
}
