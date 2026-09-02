import type { EmailLog, PricingConfig, PrintJob, User } from "@/types";

export const SEED_PRICING: PricingConfig = {
  bwPricePerPage: 2,
  colorPricePerPage: 10,
  a3BwPricePerPage: 4,
  a3ColorPricePerPage: 20,
  bindingPrice: 30,
  laminationPricePerPage: 15,
  duplexMultiplier: 2,
  facultyExemption: true,
  staffExemption: true,
  allowedDomains: ["university.edu", "flame.edu.in"],
  upiVpa: "flameuniversitypune.65015664@hdfcbank",
  upiPayeeName: "FLAME University Pune",
  gdriveFolderId: "1FLAME-REPRO-PORTAL-ROOT",
  gdriveFolderName: "FLAME_Reprographics_Root_Queue",
  gdriveRootFolderUrl:
    "https://drive.google.com/drive/folders/1FLAME-REPRO-PORTAL-ROOT?usp=sharing",
  smtpServer: "smtp.gmail.com",
  smtpPort: 587,
  smtpSenderEmail: "reprographics@flame.edu.in",
  smtpSenderName: "FLAME University Reprographics Center",
  smtpStatus: "CONNECTED",
};

export const SEED_USERS: User[] = [
  {
    id: "usr-shree-superadmin",
    name: "Shree Bhimanpelli",
    email: "shree.bhimanpelli@flame.edu.in",
    role: "SUPER_ADMIN",
    department: "Executive IT & Infrastructure",
    employeeOrStudentId: "FL-SUPER-001",
    phone: "+91 99000 11122",
    status: "ACTIVE",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    lastLoginAt: "2026-08-04T08:50:00Z",
    createdAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "usr-reprographics-admin",
    name: "Reprographics Admin",
    email: "reprographics@flame.edu.in",
    role: "SUPER_ADMIN",
    department: "Reprographics Administration",
    employeeOrStudentId: "FL-ADM-002",
    phone: "+91 99000 33344",
    status: "ACTIVE",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    lastLoginAt: "2026-08-04T08:55:00Z",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

export const SEED_JOBS: PrintJob[] = [];
export const SEED_EMAIL_LOGS: EmailLog[] = [];

export const CURRENT_USER_STORAGE_KEY = "repro_current_user_v2";
