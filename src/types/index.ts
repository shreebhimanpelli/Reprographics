export type UserRole =
  | "STUDENT"
  | "FACULTY"
  | "STAFF"
  | "REPRO_STAFF"
  | "REPRO_MANAGER"
  | "MIS_MONITOR"
  | "DEPT_HEAD"
  | "SUPER_ADMIN";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type JobStatus =
  | "QUEUED"
  | "PRINTING"
  | "IN_PROGRESS"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_SUBMITTED"
  | "VERIFIED"
  | "EXEMPT";

export type PrintType = "BW" | "COLOR";
export type DuplexMode = "SINGLE" | "DUPLEX";
export type PaperSize = "A4" | "A3" | "Letter" | "Legal";
export type Orientation = "PORTRAIT" | "LANDSCAPE";
export type BindingType = "NONE" | "SPIRAL" | "SOFT_COVER" | "HARD_COVER";
export type LaminationType = "NONE" | "ALL_PAGES" | "COVER_ONLY";
export type TabId = "submit" | "my-jobs" | "queue" | "admin" | "analytics";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  employeeOrStudentId: string;
  phone?: string;
  status: UserStatus;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface PricingConfig {
  bwPricePerPage: number;
  colorPricePerPage: number;
  a3BwPricePerPage: number;
  a3ColorPricePerPage: number;
  bindingPrice: number;
  laminationPricePerPage: number;
  duplexMultiplier: number;
  facultyExemption: boolean;
  staffExemption: boolean;
  allowedDomains: string[];
  upiVpa: string;
  upiPayeeName: string;
  gdriveFolderId: string;
  gdriveFolderName: string;
  gdriveRootFolderUrl: string;
  smtpServer: string;
  smtpPort: number;
  smtpSenderEmail: string;
  smtpSenderName: string;
  smtpStatus: string;
}

export interface PrintJob {
  id: string;
  trackingNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileDataUrl?: string;
  gdriveFileUrl: string;
  gdriveFileId: string;
  pageCount: number;
  selectedPageRange: string;
  effectivePages: number;
  copyCount: number;
  paperSheetsConsumed: number;
  paperSize: PaperSize;
  orientation: Orientation;
  printType: PrintType;
  duplexMode: DuplexMode;
  bindingType?: BindingType;
  laminationType?: LaminationType;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  jobStatus: JobStatus;
  utrReferenceNumber?: string;
  paymentReceiptUrl?: string;
  staffNotes?: string;
  notificationSentAt?: string;
  isFileDeleted?: boolean;
  fileDeletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  jobId: string;
  trackingNumber: string;
  senderEmail?: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface CartItem {
  id: string;
  file: File;
  pageCount: number;
  selectedPageRange: string;
  printType: PrintType;
  duplexMode: DuplexMode;
  paperSize: PaperSize;
  orientation: Orientation;
  bindingType: BindingType;
  laminationType: LaminationType;
  copyCount: number;
  effectivePages: number;
  paperSheetsConsumed: number;
  totalCost: number;
  ratePerPage: number;
  isExempt: boolean;
  detectingPages: boolean;
  isExpanded: boolean;
  fileDataUrl?: string;
}

export type NewPrintJobInput = Omit<PrintJob, "id" | "createdAt" | "updatedAt">;

export type NewUserInput = Omit<User, "id" | "createdAt">;

export interface LoginResult {
  success: boolean;
  message: string;
  user?: User;
}

export interface PriceBreakdown {
  ratePerPage: number;
  totalCost: number;
  printCost?: number;
  bindingCost?: number;
  laminationCost?: number;
  isExempt: boolean;
  totalImpressions: number;
  paperSheetsConsumed: number;
}

export interface DbPayload {
  users: User[];
  printJobs: PrintJob[];
  pricingConfig: PricingConfig;
  emailLogs: EmailLog[];
  paymentOrders?: PaymentOrder[];
}

export type PaymentOrderStatus =
  | "CREATED"
  | "PENDING"
  | "CHARGED"
  | "FAILED"
  | "EXPIRED";

export interface PaymentOrder {
  hdfcOrderId: string;
  jobIds: string[];
  trackingNumber: string;
  amount: number;
  userId: string;
  customerId: string;
  status: PaymentOrderStatus;
  upiIntentUrl?: string;
  txnUuid?: string;
  utrReferenceNumber?: string;
  createdAt: string;
  updatedAt: string;
}
