import {
  SEED_EMAIL_LOGS,
  SEED_JOBS,
  SEED_PRICING,
  SEED_USERS,
} from "@/lib/initialdata";
import type { DbPayload, PaymentOrder, PrintJob } from "@/types";

export type ServerStore = DbPayload & {
  paymentOrders: PaymentOrder[];
};

let store: ServerStore = {
  users: [...SEED_USERS],
  printJobs: [...SEED_JOBS],
  pricingConfig: { ...SEED_PRICING },
  emailLogs: [...SEED_EMAIL_LOGS],
  paymentOrders: [],
};

export function getServerStore(): ServerStore {
  return store;
}

export function replaceServerStore(next: Partial<ServerStore>) {
  store = {
    users: next.users ?? store.users,
    printJobs: next.printJobs ?? store.printJobs,
    pricingConfig: next.pricingConfig ?? store.pricingConfig,
    emailLogs: next.emailLogs ?? store.emailLogs,
    paymentOrders: next.paymentOrders ?? store.paymentOrders,
  };
}

export function upsertPaymentOrder(order: PaymentOrder) {
  const index = store.paymentOrders.findIndex(
    (item) => item.hdfcOrderId === order.hdfcOrderId,
  );
  if (index >= 0) {
    store.paymentOrders[index] = order;
  } else {
    store.paymentOrders = [order, ...store.paymentOrders];
  }
}

export function getPaymentOrder(hdfcOrderId: string) {
  return store.paymentOrders.find((order) => order.hdfcOrderId === hdfcOrderId);
}

export function applyPaymentSuccess(
  hdfcOrderId: string,
  utrReferenceNumber?: string,
): PrintJob[] {
  const payment = getPaymentOrder(hdfcOrderId);
  if (!payment || payment.status === "CHARGED") {
    return store.printJobs.filter((job) => payment?.jobIds.includes(job.id));
  }

  payment.status = "CHARGED";
  payment.utrReferenceNumber = utrReferenceNumber || payment.utrReferenceNumber;
  payment.updatedAt = new Date().toISOString();

  const updatedJobs: PrintJob[] = [];
  store.printJobs = store.printJobs.map((job) => {
    if (!payment.jobIds.includes(job.id)) return job;
    const next: PrintJob = {
      ...job,
      paymentStatus: "VERIFIED",
      jobStatus: "QUEUED",
      utrReferenceNumber: utrReferenceNumber || job.utrReferenceNumber,
      updatedAt: new Date().toISOString(),
    };
    updatedJobs.push(next);
    return next;
  });

  upsertPaymentOrder(payment);
  return updatedJobs;
}
