import { fulfillPaidJobs } from "@/lib/fulfill-payment";
import {
  ensureStoreLoaded,
  getPaymentOrder,
  getServerStore,
  upsertPaymentOrder,
} from "@/lib/server-store";
import {
  extractUtrFromOrderStatus,
  fetchHdfcOrderStatus,
  isHdfcConfigured,
  isHdfcPaymentSuccess,
} from "@/lib/hdfc-gateway";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await ensureStoreLoaded();
  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId is required." }, { status: 400 });
  }

  const payment = getPaymentOrder(orderId);
  if (!payment) {
    return NextResponse.json({ error: "Payment order not found." }, { status: 404 });
  }

  if (payment.status === "CHARGED") {
    let jobs = getServerStore().printJobs.filter((job) =>
      payment.jobIds.includes(job.id),
    );
    if (jobs.some((job) => !job.gdriveFileId && job.pendingFileId)) {
      jobs = await fulfillPaidJobs(orderId, payment.utrReferenceNumber);
    }
    return NextResponse.json({
      orderId,
      status: "CHARGED",
      utr: payment.utrReferenceNumber,
      jobs,
    });
  }

  if (!isHdfcConfigured()) {
    return NextResponse.json({
      orderId,
      status: payment.status,
      utr: payment.utrReferenceNumber,
    });
  }

  try {
    const remote = await fetchHdfcOrderStatus(orderId, payment.customerId || payment.userId);
    const remoteStatus = remote.status;

    if (isHdfcPaymentSuccess(remoteStatus)) {
      const utr = extractUtrFromOrderStatus(remote);
      const jobs = await fulfillPaidJobs(orderId, utr);
      return NextResponse.json({
        orderId,
        status: "CHARGED",
        utr,
        jobs,
      });
    }

    payment.status = "PENDING";
    payment.updatedAt = new Date().toISOString();
    upsertPaymentOrder(payment);

    return NextResponse.json({
      orderId,
      status: remoteStatus,
      utr: payment.utrReferenceNumber,
    });
  } catch (error) {
    console.error("HDFC payment status failed:", error);
    return NextResponse.json(
      {
        orderId,
        status: payment.status,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch HDFC payment status.",
      },
      { status: 502 },
    );
  }
}
