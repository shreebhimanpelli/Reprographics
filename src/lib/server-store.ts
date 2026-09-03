import {
  SEED_EMAIL_LOGS,
  SEED_JOBS,
  SEED_PRICING,
  SEED_USERS,
} from "@/lib/initialdata";
import { loadDurableDb, saveDurableDb } from "@/lib/drive-files";
import type { DbPayload, PaymentOrder, PrintJob, User } from "@/types";
import fs from "fs";
import path from "path";

export type ServerStore = DbPayload & {
  paymentOrders: PaymentOrder[];
};

const LOCAL_DB_PATH = path.join(process.cwd(), ".data", "repro-db.json");

let store: ServerStore = {
  users: [...SEED_USERS],
  printJobs: [...SEED_JOBS],
  pricingConfig: { ...SEED_PRICING },
  emailLogs: [...SEED_EMAIL_LOGS],
  paymentOrders: [],
};

let loaded = false;
let loadPromise: Promise<void> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function stripJob(job: PrintJob): PrintJob {
  const { fileDataUrl: _omit, ...rest } = job;
  return rest;
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => {
    const prev = map.get(item.id);
    map.set(item.id, prev ? { ...prev, ...item } : item);
  });
  return Array.from(map.values());
}

function sanitizeStore(next: ServerStore): ServerStore {
  return {
    ...next,
    printJobs: next.printJobs.map(stripJob),
  };
}

async function readLocalDb(): Promise<Partial<ServerStore> | null> {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) return null;
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf8")) as Partial<ServerStore>;
  } catch {
    return null;
  }
}

function writeLocalDb(payload: ServerStore) {
  fs.mkdirSync(path.dirname(LOCAL_DB_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(payload));
}

export async function ensureStoreLoaded() {
  if (loaded) return;
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const durable = (await loadDurableDb()) as Partial<ServerStore> | null;
        const local = await readLocalDb();
        const saved = durable || local;
        if (saved) {
          store = {
            users: saved.users?.length ? saved.users : [...SEED_USERS],
            printJobs: saved.printJobs || [],
            pricingConfig: saved.pricingConfig || { ...SEED_PRICING },
            emailLogs: saved.emailLogs || [],
            paymentOrders: saved.paymentOrders || [],
          };
        }
      } catch (error) {
        console.error("Failed to load durable store:", error);
      } finally {
        loaded = true;
      }
    })();
  }
  await loadPromise;
}

export function schedulePersist() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    persistStore().catch((error) => console.error("Failed to persist store:", error));
  }, 400);
}

export async function persistStore() {
  const payload = sanitizeStore(store);
  try {
    writeLocalDb(payload);
  } catch (error) {
    console.error("Local history save failed:", error);
  }
  try {
    await saveDurableDb(payload);
  } catch (error) {
    console.error("Drive history save failed:", error);
  }
}

export function getServerStore(): ServerStore {
  return store;
}

function mergePayments(current: PaymentOrder[], incoming: PaymentOrder[]) {
  const map = new Map(current.map((item) => [item.hdfcOrderId, item]));
  incoming.forEach((item) => {
    const prev = map.get(item.hdfcOrderId);
    map.set(item.hdfcOrderId, prev ? { ...prev, ...item } : item);
  });
  return Array.from(map.values());
}

export function replaceServerStore(next: Partial<ServerStore>, replaceAll = false) {
  if (replaceAll) {
    store = {
      users: next.users ?? store.users,
      printJobs: next.printJobs ?? store.printJobs,
      pricingConfig: next.pricingConfig ?? store.pricingConfig,
      emailLogs: next.emailLogs ?? store.emailLogs,
      paymentOrders: next.paymentOrders ?? store.paymentOrders,
    };
  } else {
    store = {
      users: next.users ? mergeById(store.users, next.users as User[]) : store.users,
      printJobs: next.printJobs
        ? mergeById(store.printJobs, next.printJobs.map(stripJob))
        : store.printJobs,
      pricingConfig: next.pricingConfig ?? store.pricingConfig,
      emailLogs: next.emailLogs
        ? mergeById(store.emailLogs, next.emailLogs)
        : store.emailLogs,
      paymentOrders: next.paymentOrders
        ? mergePayments(store.paymentOrders, next.paymentOrders)
        : store.paymentOrders,
    };
  }
  store.printJobs = store.printJobs
    .map(stripJob)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  schedulePersist();
}

export function upsertPrintJobs(jobs: PrintJob[]) {
  replaceServerStore({ printJobs: jobs });
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
  schedulePersist();
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
