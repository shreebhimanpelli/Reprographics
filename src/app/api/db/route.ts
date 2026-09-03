import { getServerStore, replaceServerStore } from "@/lib/server-store";
import type { DbPayload } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
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
  const body = (await request.json()) as Partial<DbPayload>;
  const current = getServerStore();
  replaceServerStore({
    users: body.users ?? current.users,
    printJobs: body.printJobs ?? current.printJobs,
    pricingConfig: body.pricingConfig ?? current.pricingConfig,
    emailLogs: body.emailLogs ?? current.emailLogs,
    paymentOrders: body.paymentOrders ?? current.paymentOrders,
  });
  return NextResponse.json(getServerStore());
}
