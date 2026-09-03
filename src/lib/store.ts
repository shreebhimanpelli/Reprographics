"use client";

import { useEffect, useState } from "react";
import {
  CURRENT_USER_STORAGE_KEY,
  SEED_EMAIL_LOGS,
  SEED_JOBS,
  SEED_PRICING,
  SEED_USERS,
} from "@/lib/initialdata";
import type {
  EmailLog,
  JobStatus,
  LoginResult,
  NewPrintJobInput,
  NewUserInput,
  PaymentStatus,
  PricingConfig,
  PrintJob,
  User,
  UserRole,
  UserStatus,
} from "@/types";

function mergeLockedPricing(config: PricingConfig): PricingConfig {
  return {
    ...config,
    upiVpa: SEED_PRICING.upiVpa,
    upiPayeeName: SEED_PRICING.upiPayeeName,
    duplexMultiplier: SEED_PRICING.duplexMultiplier,
  };
}

export function useReproStore() {
  const [users, setUsers] = useState<User[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(SEED_PRICING);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const stored = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        const response = await fetch("/api/db");
        if (!response.ok) throw new Error("Failed to fetch db");
        const data = await response.json();
        if (!alive) return;
        const nextUsers: User[] = data.users || SEED_USERS;
        setUsers(nextUsers);
        setPrintJobs(data.printJobs || SEED_JOBS);
        setEmailLogs(data.emailLogs || SEED_EMAIL_LOGS);
        setPricingConfig(mergeLockedPricing(data.pricingConfig || SEED_PRICING));
        if (stored) {
          const parsed = JSON.parse(stored) as { id?: string };
          const match = nextUsers.find((user) => user.id === parsed.id);
          setCurrentUser(match || null);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error loading repro storage:", error);
        if (!alive) return;
        setUsers(SEED_USERS);
        setPrintJobs(SEED_JOBS);
        setPricingConfig(SEED_PRICING);
        setEmailLogs(SEED_EMAIL_LOGS);
        setCurrentUser(null);
      } finally {
        if (alive) setIsLoaded(true);
      }
    })();

    const poll = setInterval(() => {
      fetch("/api/db")
        .then((res) => res.json())
        .then((data) => {
          if (!alive || !data) return;
          if (data.users) setUsers(data.users);
          if (data.printJobs) setPrintJobs(data.printJobs);
          if (data.emailLogs) setEmailLogs(data.emailLogs);
          if (data.pricingConfig) {
            setPricingConfig(mergeLockedPricing(data.pricingConfig));
          }
        })
        .catch((error) => console.error("Polling error:", error));
    }, 5000);

    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, []);

  const persistUsers = (next: User[]) => {
    setUsers(next);
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ users: next }),
    }).catch(console.error);
  };

  const persistJobs = (next: PrintJob[]) => {
    setPrintJobs(next);
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ printJobs: next }),
    }).catch(console.error);
  };

  const persistPricing = (next: PricingConfig) => {
    setPricingConfig(next);
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pricingConfig: next }),
    }).catch(console.error);
  };

  const persistEmailLogs = (next: EmailLog[]) => {
    setEmailLogs(next);
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailLogs: next }),
    }).catch(console.error);
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
  };

  const sendPickupNotificationEmail = (
    job: PrintJob,
    subject?: string,
    body?: string,
  ) => {
    const nextSubject =
      subject ||
      `🎉 Your Print Job [${job.trackingNumber}] is Ready for Pickup!`;
    const nextBody =
      body ||
      `Dear ${job.userName},\n\nGreat news! Your print job "${job.fileName}" (Tracking ID: ${job.trackingNumber}) has been printed and is now ready for pickup.\n\n📍 Pickup Location: Main Reprographics Center, Admin Block, Ground Floor\n⏰ Pickup Hours: Monday - Saturday (8:30 AM - 7:00 PM)\n📄 Document Details: ${job.effectivePages} page(s) × ${job.copyCount} copy(ies) [${job.printType === "COLOR" ? "Color" : "Black & White"}]\n💰 Total Paid: ₹${job.totalAmount.toFixed(2)}\n\nPlease show your Tracking ID (${job.trackingNumber}) at the counter.\n\nBest regards,\nUniversity Reprographics Center\nContact: reprographics@flame.edu.in`;

    const log: EmailLog = {
      id: `email-${Date.now()}`,
      jobId: job.id,
      trackingNumber: job.trackingNumber,
      senderEmail: "reprographics@flame.edu.in",
      recipientEmail: job.userEmail,
      subject: nextSubject,
      body: nextBody,
      sentAt: new Date().toISOString(),
    };

    fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toEmail: job.userEmail,
        subject: nextSubject,
        htmlBody: `<div style="font-family: sans-serif; line-height: 1.5; color: #333;">${nextBody.replace(/\n/g, "<br/>")}</div>`,
      }),
    }).catch((error) => console.error("Failed to trigger email API:", error));

    persistEmailLogs([log, ...emailLogs]);
    return log;
  };

  return {
    users,
    printJobs,
    pricingConfig,
    emailLogs,
    currentUser,
    isLoaded,
    switchUser,
    logout: () => {
      setCurrentUser(null);
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    },
    loginWithGoogle: (email: string, _name: string): LoginResult => {
      const domain = email.split("@")[1];
      if (
        pricingConfig.allowedDomains.length > 0 &&
        !pricingConfig.allowedDomains.some(
          (allowed) => allowed.toLowerCase() === domain?.toLowerCase(),
        )
      ) {
        return {
          success: false,
          message: `Domain "@${domain}" is restricted. Please sign in with an official university account (${pricingConfig.allowedDomains.map((d) => "@" + d).join(", ")}).`,
        };
      }

      let match = users.find(
        (user) => user.email.toLowerCase() === email.toLowerCase(),
      );
      if (!match) {
        return {
          success: false,
          message:
            "Access Denied: You are not registered in the Reprographics User Database. Please contact the administrator for access.",
        };
      }

      if (match.status === "INACTIVE" || match.status === "SUSPENDED") {
        return {
          success: false,
          message: `Account [${email}] is currently ${match.status.toLowerCase()}. Please contact the Reprographics Administrator.`,
        };
      }

      const updated = { ...match, lastLoginAt: new Date().toISOString() };
      persistUsers(users.map((user) => (user.id === match!.id ? updated : user)));
      match = updated;
      switchUser(match);
      return {
        success: true,
        message: "Google SSO Authentication Successful!",
        user: match,
      };
    },
    addUser: (input: NewUserInput) => {
      const user: User = {
        ...input,
        id: `usr-${Date.now()}`,
        status: input.status || "ACTIVE",
        createdAt: new Date().toISOString(),
      };
      persistUsers([user, ...users]);
      return user;
    },
    updateUserRole: (id: string, role: UserRole) => {
      const next = users.map((user) => (user.id === id ? { ...user, role } : user));
      persistUsers(next);
      if (currentUser?.id === id) {
        const updated = next.find((user) => user.id === id);
        if (updated) switchUser(updated);
      }
    },
    updateUserStatus: (id: string, status: UserStatus) => {
      const next = users.map((user) =>
        user.id === id ? { ...user, status } : user,
      );
      persistUsers(next);
      if (currentUser?.id === id) {
        const updated = next.find((user) => user.id === id);
        if (updated) switchUser(updated);
      }
    },
    updateUser: (id: string, patch: Partial<User>) => {
      const next = users.map((user) =>
        user.id === id ? { ...user, ...patch } : user,
      );
      persistUsers(next);
      if (currentUser?.id === id) {
        const updated = next.find((user) => user.id === id);
        if (updated) switchUser(updated);
      }
    },
    deleteUser: (id: string) => {
      persistUsers(users.filter((user) => user.id !== id));
    },
    bulkUploadUsers: (incoming: NewUserInput[]) => {
      const stamped = incoming.map((user, index) => ({
        ...user,
        id: `usr-bulk-${Date.now()}-${index}`,
        status: user.status || "ACTIVE",
        createdAt: new Date().toISOString(),
      })) as User[];
      const next = [...users];
      stamped.forEach((user) => {
        const index = next.findIndex(
          (existing) => existing.email.toLowerCase() === user.email.toLowerCase(),
        );
        if (index >= 0) next[index] = { ...next[index], ...user };
        else next.push(user);
      });
      persistUsers(next);
    },
    createPrintJob: (input: NewPrintJobInput | PrintJob) => {
      const now = new Date().toISOString();
      const job: PrintJob =
        "id" in input && input.id
          ? { ...input, updatedAt: input.updatedAt || now }
          : {
              ...(input as NewPrintJobInput),
              id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              createdAt: now,
              updatedAt: now,
            };
      setPrintJobs((prev) => {
        const next = [job, ...prev.filter((item) => item.id !== job.id)];
        fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ printJobs: next }),
        }).catch(console.error);
        return next;
      });
      return job;
    },
    updateJobStatus: (
      id: string,
      jobStatus: JobStatus,
      paymentStatus?: PaymentStatus,
      staffNotes?: string,
    ) => {
      const next = printJobs.map((job) => {
        if (job.id !== id) return job;
        const becameReady =
          jobStatus === "READY_FOR_PICKUP" && job.jobStatus !== "READY_FOR_PICKUP";
        return {
          ...job,
          jobStatus,
          paymentStatus: paymentStatus || job.paymentStatus,
          staffNotes: staffNotes !== undefined ? staffNotes : job.staffNotes,
          updatedAt: new Date().toISOString(),
          notificationSentAt: becameReady
            ? new Date().toISOString()
            : job.notificationSentAt,
        };
      });
      persistJobs(next);
      const updated = next.find((job) => job.id === id);
      if (updated && jobStatus === "READY_FOR_PICKUP") {
        sendPickupNotificationEmail(updated);
      }
    },
    deleteJobFilePayload: (id: string) => {
      persistJobs(
        printJobs.map((job) =>
          job.id === id
            ? {
                ...job,
                fileDataUrl: undefined,
                isFileDeleted: true,
                fileDeletedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : job,
        ),
      );
    },
    submitPaymentUTR: (ids: string[], utr: string, receiptUrl?: string) => {
      persistJobs(
        printJobs.map((job) =>
          ids.includes(job.id)
            ? {
                ...job,
                utrReferenceNumber: utr,
                paymentReceiptUrl: receiptUrl || job.paymentReceiptUrl,
                paymentStatus: "PAYMENT_SUBMITTED",
                jobStatus: "QUEUED",
                updatedAt: new Date().toISOString(),
              }
            : job,
        ),
      );
    },
    applyVerifiedPayment: (jobs: PrintJob[]) => {
      const map = new Map(printJobs.map((job) => [job.id, job]));
      jobs.forEach((job) => map.set(job.id, { ...map.get(job.id), ...job }));
      persistJobs(Array.from(map.values()));
    },
    sendPickupNotificationEmail,
    persistPricing,
    resetToSeedData: () => {
      persistUsers(SEED_USERS);
      setPrintJobs(SEED_JOBS);
      fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replaceAll: true,
          users: SEED_USERS,
          printJobs: SEED_JOBS,
          pricingConfig: SEED_PRICING,
          emailLogs: SEED_EMAIL_LOGS,
        }),
      }).catch(console.error);
      persistPricing(SEED_PRICING);
      persistEmailLogs(SEED_EMAIL_LOGS);
      switchUser(SEED_USERS[0]);
    },
  };
}
