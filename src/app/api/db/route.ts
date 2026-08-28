import {
  SEED_EMAIL_LOGS,
  SEED_JOBS,
  SEED_PRICING,
  SEED_USERS,
} from "@/lib/initialdata";
import type { DbPayload } from "@/types";
import { NextRequest, NextResponse } from "next/server";

let store: DbPayload = {
  users: [...SEED_USERS],
  printJobs: [...SEED_JOBS],
  pricingConfig: { ...SEED_PRICING },
  emailLogs: [...SEED_EMAIL_LOGS],
};

export async function GET() {
  return NextResponse.json(store);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<DbPayload>;
  store = {
    users: body.users ?? store.users,
    printJobs: body.printJobs ?? store.printJobs,
    pricingConfig: body.pricingConfig ?? store.pricingConfig,
    emailLogs: body.emailLogs ?? store.emailLogs,
  };
  return NextResponse.json(store);
}
