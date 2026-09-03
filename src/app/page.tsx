"use client";

import { AdminPanel } from "@/components/adminpanel";
import { AnalyticsView } from "@/components/analyticsview";
import { BrandMark } from "@/components/brand-mark";
import { BottomNav } from "@/components/bottom-nav";
import { EmailNotificationModal } from "@/components/emailnotificationmodal";
import { GoogleMark, GoogleSSOModal } from "@/components/googlessomodal";
import { JobCard } from "@/components/jobcard";
import { Navbar } from "@/components/navbar";
import { PrintForm } from "@/components/printform";
import { PrintPreviewModal } from "@/components/printpreviewmodal";
import { QRCodeModal } from "@/components/qrcodemodal";
import { QRScanAuthModal } from "@/components/qrscanauthmodal";
import { QueueDashboard } from "@/components/queuedashboard";
import { UpiPaymentModal } from "@/components/upipaymentmodal";
import { useReproStore } from "@/lib/store";
import type { EmailLog, PrintJob, TabId } from "@/types";
import { ArrowRight, CheckCircle2, Clock, FileText, X } from "lucide-react";
import confetti from "canvas-confetti";
import { useState } from "react";

export default function HomePage() {
  const {
    users,
    printJobs,
    pricingConfig,
    emailLogs,
    currentUser,
    isLoaded,
    switchUser,
    logout,
    loginWithGoogle,
    addUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    bulkUploadUsers,
    createPrintJob,
    updateJobStatus,
    deleteJobFilePayload,
    submitPaymentUTR,
    applyVerifiedPayment,
    sendPickupNotificationEmail,
    persistPricing,
    resetToSeedData,
  } = useReproStore();

  const [activeTab, setActiveTab] = useState<TabId>("submit");
  const [ssoOpen, setSsoOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [payJobs, setPayJobs] = useState<PrintJob[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [emailLog, setEmailLog] = useState<EmailLog | null>(null);
  const [emailJob, setEmailJob] = useState<PrintJob | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [successJob, setSuccessJob] = useState<PrintJob | null>(null);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-flame-ivory flex flex-col items-center justify-center text-flame-ink">
        <div className="w-12 h-12 border-4 border-flame-orange border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-flame-muted font-bold">
          Loading Reprographics Queue Engine...
        </p>
      </div>
    );
  }

  const celebrate = (jobs: PrintJob[]) => {
    setSuccessJob(jobs[0]);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
  };

  const viewEmailLog = (job: PrintJob) => {
    const found = emailLogs.find(
      (log) => log.jobId === job.id || log.trackingNumber === job.trackingNumber,
    );
    setEmailLog(
      found || {
        id: "email-temp",
        jobId: job.id,
        trackingNumber: job.trackingNumber,
        recipientEmail: job.userEmail,
        subject: `Your Print Job ${job.trackingNumber} is Ready for Pickup!`,
        body: `Dear ${job.userName},\n\nYour print job "${job.fileName}" (${job.trackingNumber}) is READY FOR PICKUP at the Reprographics Center.`,
        sentAt: job.notificationSentAt || new Date().toISOString(),
      },
    );
    setEmailOpen(true);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-flame-ivory text-flame-ink">
        <Navbar
          currentUser={null}
          users={users}
          onSwitchUser={switchUser}
          onOpenGoogleSSO={() => setSsoOpen(true)}
          onOpenQRCode={() => setScanOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onResetData={resetToSeedData}
          onLogout={logout}
        />
        <main className="flex-1 w-full mx-auto px-4 py-8 sm:py-16 flex items-center justify-center">
          <section className="module-card w-full max-w-lg p-6 sm:p-10 text-center">
            <BrandMark variant="hero" className="mb-6" />
            <span className="section-kicker mx-auto mb-3 inline-flex px-3 py-1 rounded-full border border-flame-blue/20 bg-flame-blue/5">
              Reprographics Portal
            </span>
            <h1 className="font-display text-[1.65rem] sm:text-4xl font-bold text-flame-blue tracking-tight">
              Google Single Sign-On Required
            </h1>
            <p className="text-sm text-flame-muted mt-3 max-w-md mx-auto font-medium leading-relaxed">
              Please sign in with your official university Google account (
              <span className="font-mono text-flame-blue font-bold">@flame.edu.in</span>) to
              submit print jobs and access reprographics services.
            </p>
            <button
              type="button"
              onClick={() => setSsoOpen(true)}
              className="mt-8 w-full sm:w-auto px-8 min-h-12 py-3.5 rounded-2xl bg-flame-blue hover:bg-flame-blue-deep text-white font-extrabold text-sm shadow-module inline-flex items-center justify-center gap-3 group"
            >
              <div className="w-5 h-5 rounded-full bg-white p-0.5 flex items-center justify-center flex-shrink-0">
                <GoogleMark />
              </div>
              <span>Sign In with Google SSO</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </section>
        </main>
        <footer className="border-t border-flame-blue/10 bg-flame-ivory py-6">
          <BrandMark variant="footer" />
        </footer>
        <GoogleSSOModal
          isOpen={ssoOpen}
          onClose={() => setSsoOpen(false)}
          onLogin={loginWithGoogle}
          pricingConfig={pricingConfig}
        />
        <QRScanAuthModal
          isOpen={scanOpen}
          onClose={() => setScanOpen(false)}
          currentUser={currentUser}
          pricingConfig={pricingConfig}
          onOpenGoogleSSO={() => {
            setScanOpen(false);
            setSsoOpen(true);
          }}
          onProceedToPrint={() => {
            setScanOpen(false);
            setActiveTab("submit");
          }}
        />
      </div>
    );
  }

  const myJobs = printJobs.filter((job) => job.userId === currentUser.id);

  return (
    <div className="min-h-screen flex flex-col bg-flame-ivory text-flame-ink pb-20 md:pb-0">
      <Navbar
        currentUser={currentUser}
        users={users}
        onSwitchUser={switchUser}
        onOpenGoogleSSO={() => setSsoOpen(true)}
        onOpenQRCode={() => setQrOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={resetToSeedData}
        onLogout={logout}
      />
      <main className="flex-1 max-w-page w-full mx-auto px-4 py-6 sm:py-8 space-y-8">
        {successJob && (
          <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                  Print Request Submitted Successfully!
                </span>
                <h3 className="text-lg font-black text-flame-ink mt-1">
                  Tracking ID:{" "}
                  <span className="font-mono text-flame-blue">
                    {successJob.trackingNumber}
                  </span>
                </h3>
                <p className="text-xs text-flame-muted">
                  Document:{" "}
                  <span className="font-medium text-flame-ink">{successJob.fileName}</span> (
                  {successJob.effectivePages} pages, {successJob.copyCount} copies)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("my-jobs");
                  setSuccessJob(null);
                }}
                className="flex-1 sm:flex-none px-4 min-h-11 rounded-xl bg-flame-orange text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                Track Job Status
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSuccessJob(null)}
                className="p-2 min-h-11 min-w-11 rounded-xl text-flame-muted hover:bg-flame-paper"
              >
                <X className="w-5 h-5 mx-auto" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "submit" && (
          <PrintForm
            currentUser={currentUser}
            pricingConfig={pricingConfig}
            onSubmitJob={createPrintJob}
            onProceedToPayment={(jobs) => {
              setPayJobs(jobs);
              setPayOpen(true);
            }}
            onSuccessDirect={celebrate}
          />
        )}

        {activeTab === "my-jobs" && (
          <div className="space-y-6">
            <div className="bg-flame-blue text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
                  <Clock className="w-5 h-5 text-flame-gold" />
                  My Print Submissions ({myJobs.length})
                </h2>
                <p className="text-xs text-white/80 mt-1">
                  History of print requests submitted under{" "}
                  <strong className="text-white">{currentUser.email}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("submit")}
                className="px-4 min-h-11 rounded-xl bg-flame-orange text-white font-bold text-xs"
              >
                + Submit New Print Job
              </button>
            </div>
            {myJobs.length === 0 ? (
              <div className="bg-flame-paper border border-flame-blue/10 rounded-2xl p-12 text-center text-flame-muted">
                <FileText className="w-12 h-12 mx-auto text-flame-blue/30 mb-3" />
                <h3 className="text-base font-bold text-flame-ink mb-1">
                  No print history yet
                </h3>
                <p className="text-xs mb-4">
                  You haven&apos;t submitted any print jobs under this profile yet.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("submit")}
                  className="px-4 min-h-11 rounded-xl bg-flame-blue text-white text-xs font-bold"
                >
                  Submit Your First Job
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    currentUserRole={currentUser.role}
                    onUpdateStatus={updateJobStatus}
                    onViewReceipt={(item) => setReceiptUrl(item.paymentReceiptUrl || null)}
                    onViewEmailLog={viewEmailLog}
                    onViewDriveFile={(item) => window.open(item.gdriveFileUrl, "_blank")}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "queue" && (
          <QueueDashboard
            jobs={printJobs}
            currentUserRole={currentUser.role}
            onUpdateStatus={updateJobStatus}
            onDeleteFilePayload={deleteJobFilePayload}
            onViewReceipt={(job) => setReceiptUrl(job.paymentReceiptUrl || null)}
            onViewEmailLog={viewEmailLog}
            onComposeEmail={(job) => {
              setEmailJob(job);
              setEmailLog(null);
              setEmailOpen(true);
            }}
            onPrintJob={(job) => setPrintJob(job)}
          />
        )}

        {activeTab === "admin" && (
          <AdminPanel
            users={users}
            pricingConfig={pricingConfig}
            onUpdateRole={updateUserRole}
            onUpdateStatus={updateUserStatus}
            onDeleteUser={deleteUser}
            onAddUser={addUser}
            onBulkUpload={bulkUploadUsers}
            onSavePricing={persistPricing}
          />
        )}

        {activeTab === "analytics" && <AnalyticsView jobs={printJobs} />}
      </main>

      <footer className="border-t border-flame-blue/10 bg-flame-ivory py-6 pb-24 md:pb-6">
        <BrandMark variant="footer" />
      </footer>

      <BottomNav
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <GoogleSSOModal
        isOpen={ssoOpen}
        onClose={() => setSsoOpen(false)}
        onLogin={loginWithGoogle}
        pricingConfig={pricingConfig}
      />
      <UpiPaymentModal
        isOpen={payOpen}
        jobs={payJobs}
        currentUser={currentUser}
        pricingConfig={pricingConfig}
        onClose={() => setPayOpen(false)}
        onPaymentSuccess={(paidJobs) => {
          applyVerifiedPayment(paidJobs);
          celebrate(paidJobs);
        }}
        onSubmitUTR={(ids, utr, receipt) => {
          submitPaymentUTR(ids, utr, receipt);
          const paid = printJobs.filter((job) => ids.includes(job.id));
          if (paid.length > 0) celebrate(paid);
        }}
      />
      <EmailNotificationModal
        isOpen={emailOpen}
        log={emailLog}
        job={emailJob}
        onClose={() => {
          setEmailOpen(false);
          setEmailLog(null);
          setEmailJob(null);
        }}
        onSendEmail={(job, subject, body) => {
          sendPickupNotificationEmail(job, subject, body);
        }}
      />
      <QRCodeModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        onOpenQRScanner={() => setScanOpen(true)}
      />
      <QRScanAuthModal
        isOpen={scanOpen}
        onClose={() => setScanOpen(false)}
        currentUser={currentUser}
        pricingConfig={pricingConfig}
        onOpenGoogleSSO={() => {
          setScanOpen(false);
          setSsoOpen(true);
        }}
        onProceedToPrint={() => {
          setActiveTab("submit");
        }}
      />
      {receiptUrl && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-flame-ink/45 backdrop-blur-md">
          <div className="w-full sm:max-w-lg bg-flame-paper border border-flame-blue/10 rounded-t-3xl sm:rounded-2xl p-6 shadow-module-lg space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-flame-blue/10 pb-3">
              <h3 className="font-display font-bold text-flame-blue text-sm">
                Payment Confirmation Receipt
              </h3>
              <button
                type="button"
                onClick={() => setReceiptUrl(null)}
                className="p-2 min-h-11 min-w-11 text-flame-muted"
              >
                <X className="w-5 h-5 mx-auto" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-flame-ivory p-2 border border-flame-blue/10 text-center">
              <img
                src={receiptUrl}
                alt="Receipt Screenshot"
                className="max-h-96 mx-auto object-contain rounded-xl"
              />
            </div>
            <button
              type="button"
              onClick={() => setReceiptUrl(null)}
              className="w-full min-h-11 py-2 bg-flame-blue text-xs font-bold text-white rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <PrintPreviewModal
        isOpen={!!printJob}
        job={printJob}
        onClose={() => setPrintJob(null)}
        onPrintStarted={(id) => {
          updateJobStatus(id, "IN_PROGRESS");
          setPrintJob(null);
        }}
      />
    </div>
  );
}
