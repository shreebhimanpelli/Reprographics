import { getServerStore, upsertPaymentOrder, upsertPrintJobs } from "@/lib/server-store";
import {
  buildUpiIntentUrl,
  createHdfcSession,
  getHdfcConfig,
  initiateHdfcUpiPay,
  isHdfcConfigured,
  toHdfcCustomerId,
  toHdfcOrderId,
} from "@/lib/hdfc-gateway";
import type { PaymentOrder, PrintJob } from "@/types";
import { NextRequest, NextResponse } from "next/server";

function merchantUpiUrl(vpa: string, payee: string, amount: number, note: string) {
  const query = new URLSearchParams({
    pa: vpa,
    pn: payee,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note.slice(0, 50),
  });
  return `upi://pay?${query.toString()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      jobIds: string[];
      jobs?: PrintJob[];
      userId: string;
      userEmail: string;
      userPhone?: string;
      trackingNumber: string;
      amount: number;
      upiVpa?: string;
      upiPayeeName?: string;
    };

    if (body.jobs?.length) {
      upsertPrintJobs(body.jobs);
    }

    const store = getServerStore();
    const jobs = store.printJobs.filter((job) => body.jobIds.includes(job.id));
    if (jobs.length === 0) {
      return NextResponse.json({ error: "No matching print jobs found." }, { status: 404 });
    }

    const expectedAmount = jobs.reduce((sum, job) => sum + job.totalAmount, 0);
    if (Math.abs(expectedAmount - body.amount) > 0.01) {
      return NextResponse.json(
        { error: "Payment amount does not match job total." },
        { status: 400 },
      );
    }

    const hdfcOrderId = toHdfcOrderId(body.trackingNumber);
    const customerId = toHdfcCustomerId(body.userId);
    const amount = expectedAmount.toFixed(2);
    const phone = (body.userPhone || "9999999999").replace(/\D/g, "").slice(-10);
    const fallbackUrl = merchantUpiUrl(
      body.upiVpa || store.pricingConfig.upiVpa,
      body.upiPayeeName || store.pricingConfig.upiPayeeName,
      expectedAmount,
      body.trackingNumber,
    );

    let upiIntentUrl = fallbackUrl;
    let txnUuid: string | undefined;
    let status: PaymentOrder["status"] = "PENDING";

    if (isHdfcConfigured()) {
      await createHdfcSession({
        orderId: hdfcOrderId,
        amount,
        customerId,
        customerEmail: body.userEmail,
        customerPhone: phone,
        description: `FLAME Reprographics ${body.trackingNumber}`,
      });

      const upiResponse = await initiateHdfcUpiPay({
        orderId: hdfcOrderId,
        customerId,
      });

      upiIntentUrl = buildUpiIntentUrl(upiResponse.payment?.sdk_params) || fallbackUrl;
      txnUuid = upiResponse.txn_uuid;
      status = "PENDING";
    }

    const now = new Date().toISOString();
    const paymentOrder: PaymentOrder = {
      hdfcOrderId,
      jobIds: jobs.map((job) => job.id),
      trackingNumber: body.trackingNumber,
      amount: expectedAmount,
      userId: body.userId,
      customerId,
      status,
      upiIntentUrl,
      txnUuid,
      createdAt: now,
      updatedAt: now,
    };

    upsertPaymentOrder(paymentOrder);

    return NextResponse.json({
      orderId: hdfcOrderId,
      amount: expectedAmount,
      upiIntentUrl,
      status: "PENDING_VBV",
      autoVerify: isHdfcConfigured(),
      gateway: isHdfcConfigured()
        ? getHdfcConfig().baseUrl.includes("uat")
          ? "sandbox"
          : "production"
        : "merchant-upi",
      method: "UPI_INTENT",
    });
  } catch (error) {
    console.error("HDFC payment create failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create HDFC payment session.",
      },
      { status: 500 },
    );
  }
}
