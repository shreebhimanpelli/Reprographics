import {
  getPaymentOrder,
  getServerStore,
  upsertPaymentOrder,
} from "@/lib/server-store";
import {
  buildUpiIntentUrl,
  createHdfcSession,
  extractUtrFromOrderStatus,
  fetchHdfcOrderStatus,
  getHdfcConfig,
  initiateHdfcUpiPay,
  isHdfcConfigured,
  isHdfcPaymentSuccess,
  toHdfcOrderId,
} from "@/lib/hdfc-gateway";
import type { PaymentOrder } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isHdfcConfigured()) {
    return NextResponse.json(
      {
        code: "HDFC_NOT_CONFIGURED",
        error:
          "HDFC SmartGateway is not configured. Add HDFC_API_KEY, HDFC_MERCHANT_ID, HDFC_PAYMENT_PAGE_CLIENT_ID, and HDFC_RETURN_URL to your environment.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      jobIds: string[];
      userId: string;
      userEmail: string;
      userPhone?: string;
      trackingNumber: string;
      amount: number;
    };

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
    const customerId = body.userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
    const amount = expectedAmount.toFixed(2);
    const phone = (body.userPhone || "9999999999").replace(/\D/g, "").slice(-10);

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

    const upiIntentUrl = buildUpiIntentUrl(upiResponse.payment?.sdk_params);
    const now = new Date().toISOString();
    const paymentOrder: PaymentOrder = {
      hdfcOrderId,
      jobIds: jobs.map((job) => job.id),
      trackingNumber: body.trackingNumber,
      amount: expectedAmount,
      userId: body.userId,
      status: "PENDING",
      upiIntentUrl,
      txnUuid: upiResponse.txn_uuid,
      createdAt: now,
      updatedAt: now,
    };

    upsertPaymentOrder(paymentOrder);

    return NextResponse.json({
      orderId: hdfcOrderId,
      amount: expectedAmount,
      upiIntentUrl,
      status: upiResponse.status || "PENDING_VBV",
      gateway: getHdfcConfig().baseUrl.includes("uat") ? "sandbox" : "production",
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
