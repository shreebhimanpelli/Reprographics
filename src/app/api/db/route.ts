import { ensureStoreLoaded, getServerStore, replaceServerStore } from "@/lib/server-store";
import type { DbPayload } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  await ensureStoreLoaded();
  const store = getServerStore();
  return NextResponse.json({
    users: store.users,
    printJobs: store.printJobs,
    pricingConfig: store.pricingConfig,
    emailLogs: store.emailLogs,
    paymentOrders: store.paymentOrders,
  });
}

export async function POST(request: NextRequest) {
  await ensureStoreLoaded();
  const body = (await request.json()) as Partial<DbPayload> & { replaceAll?: boolean };
  replaceServerStore(
    {
      users: body.users,
      printJobs: body.printJobs,
      pricingConfig: body.pricingConfig,
      emailLogs: body.emailLogs,
      paymentOrders: body.paymentOrders,
    },
    Boolean(body.replaceAll),
  );
  return NextResponse.json(getServerStore());
}
