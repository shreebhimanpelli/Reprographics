import { fulfillPaidJobs } from "@/lib/fulfill-payment";
import { ensureStoreLoaded } from "@/lib/server-store";
import {
  isHdfcPaymentSuccess,
  verifyHdfcWebhookAuth,
} from "@/lib/hdfc-gateway";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  await ensureStoreLoaded();
  if (!verifyHdfcWebhookAuth(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized webhook." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      order_id?: string;
      status?: string;
      event_name?: string;
      txn_detail?: { txn_id?: string; status?: string };
      content?: {
        order?: { order_id?: string; status?: string };
        txn_detail?: { txn_id?: string; status?: string };
      };
    };

    const orderId =
      payload.order_id ||
      payload.content?.order?.order_id;

    const status =
      payload.status ||
      payload.content?.order?.status ||
      payload.txn_detail?.status ||
      payload.content?.txn_detail?.status;

    if (!orderId) {
      return NextResponse.json({ received: true, ignored: "missing order_id" });
    }

    if (isHdfcPaymentSuccess(status)) {
      const utr =
        payload.txn_detail?.txn_id ||
        payload.content?.txn_detail?.txn_id ||
        orderId;
      await fulfillPaidJobs(orderId, utr);
    }

    return NextResponse.json({ received: true, orderId, status });
  } catch (error) {
    console.error("HDFC webhook processing failed:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
