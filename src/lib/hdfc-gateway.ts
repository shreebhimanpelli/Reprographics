export type HdfcOrderStatus =
  | "NEW"
  | "PENDING_VBV"
  | "CHARGED"
  | "AUTHORIZATION_FAILED"
  | "AUTHENTICATION_FAILED"
  | "AUTHORIZING"
  | "VOIDED"
  | "AUTO_REFUNDED"
  | string;

export interface HdfcSdkParams {
  pgIntentUrl?: string;
  tr?: string;
  tid?: string;
  merchant_vpa?: string;
  merchant_name?: string;
  mcc?: string;
  amount?: string;
  currency?: string;
  tn?: string;
  ver?: string;
  mode?: string;
  qrMedium?: string;
  [key: string]: string | undefined;
}

export interface HdfcUpiPayResponse {
  status: HdfcOrderStatus;
  order_id: string;
  txn_id?: string;
  txn_uuid?: string;
  payment?: {
    sdk_params?: HdfcSdkParams;
  };
}

export interface HdfcOrderStatusResponse {
  order_id: string;
  status: HdfcOrderStatus;
  status_id?: number;
  amount?: number | string;
  txn_detail?: {
    txn_id?: string;
    status?: string;
    error_code?: string | null;
  };
  payment_method_type?: string;
  payment_method?: string;
}

export interface HdfcGatewayConfig {
  apiKey: string;
  merchantId: string;
  paymentPageClientId: string;
  resellerId: string;
  baseUrl: string;
  returnUrl: string;
  webhookUsername?: string;
  webhookPassword?: string;
}

export function isHdfcConfigured() {
  return Boolean(
    process.env.HDFC_API_KEY &&
      process.env.HDFC_MERCHANT_ID &&
      process.env.HDFC_PAYMENT_PAGE_CLIENT_ID &&
      process.env.HDFC_RETURN_URL,
  );
}

export function getHdfcConfig(): HdfcGatewayConfig {
  const sandbox = process.env.HDFC_ENV !== "production";
  return {
    apiKey: process.env.HDFC_API_KEY || "",
    merchantId: process.env.HDFC_MERCHANT_ID || "",
    paymentPageClientId: process.env.HDFC_PAYMENT_PAGE_CLIENT_ID || "hdfcmaster",
    resellerId: process.env.HDFC_RESELLER_ID || "hdfc_reseller",
    baseUrl: sandbox
      ? "https://smartgateway.hdfcuat.bank.in"
      : "https://smartgateway.hdfc.bank.in",
    returnUrl: process.env.HDFC_RETURN_URL || "",
    webhookUsername: process.env.HDFC_WEBHOOK_USERNAME,
    webhookPassword: process.env.HDFC_WEBHOOK_PASSWORD,
  };
}

function basicAuthHeader(apiKey: string) {
  const token = Buffer.from(apiKey).toString("base64");
  return `Basic ${token}`;
}

function commonHeaders(config: HdfcGatewayConfig, customerId: string) {
  return {
    Authorization: basicAuthHeader(config.apiKey),
    "Content-Type": "application/json",
    "x-merchantid": config.merchantId,
    "x-customerid": customerId,
    "x-resellerid": config.resellerId,
  };
}

export function toHdfcOrderId(trackingNumber: string) {
  const compact = trackingNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return `${compact}${suffix}`.slice(0, 20);
}

export async function createHdfcSession(input: {
  orderId: string;
  amount: string;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  description?: string;
}) {
  const config = getHdfcConfig();
  const response = await fetch(`${config.baseUrl}/session`, {
    method: "POST",
    headers: commonHeaders(config, input.customerId),
    body: JSON.stringify({
      order_id: input.orderId,
      amount: input.amount,
      customer_id: input.customerId,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      payment_page_client_id: config.paymentPageClientId,
      action: "paymentPage",
      currency: "INR",
      return_url: config.returnUrl,
      description: input.description || "FLAME Reprographics print job",
      first_name: input.customerEmail.split("@")[0] || "Student",
      last_name: "FLAME",
    }),
  });

  const text = await response.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`HDFC session response was not JSON: ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(
      `HDFC session failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  return data;
}

export async function initiateHdfcUpiPay(input: {
  orderId: string;
  customerId: string;
}) {
  const config = getHdfcConfig();
  const body = new URLSearchParams({
    order_id: input.orderId,
    merchant_id: config.merchantId,
    payment_method_type: "UPI",
    payment_method: "UPI_PAY",
    txn_type: "UPI_PAY",
    sdk_params: "true",
    redirect_after_payment: "true",
    format: "json",
  });

  const response = await fetch(`${config.baseUrl}/txns`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(config.apiKey),
      "Content-Type": "application/x-www-form-urlencoded",
      "x-merchantid": config.merchantId,
      "x-customerid": input.customerId,
      "x-resellerid": config.resellerId,
    },
    body,
  });

  const text = await response.text();
  let data: HdfcUpiPayResponse = {
    status: "PENDING_VBV",
    order_id: input.orderId,
  };
  try {
    data = text ? JSON.parse(text) : data;
  } catch {
    throw new Error(`HDFC UPI response was not JSON: ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(
      `HDFC UPI_PAY failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  return data;
}

export function buildUpiIntentUrl(sdkParams?: HdfcSdkParams) {
  if (!sdkParams) return "";
  if (sdkParams.pgIntentUrl) return sdkParams.pgIntentUrl;

  const query = new URLSearchParams();
  const mapping: Record<string, string | undefined> = {
    ver: sdkParams.ver,
    mode: sdkParams.mode,
    tr: sdkParams.tr,
    tid: sdkParams.tid,
    tn: sdkParams.tn,
    pn: sdkParams.merchant_name,
    pa: sdkParams.merchant_vpa,
    mc: sdkParams.mcc,
    am: sdkParams.amount,
    cu: sdkParams.currency || "INR",
    qrMedium: sdkParams.qrMedium,
  };

  Object.entries(mapping).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  return `upi://pay?${query.toString()}`;
}

export async function fetchHdfcOrderStatus(orderId: string, customerId: string) {
  const config = getHdfcConfig();
  const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: basicAuthHeader(config.apiKey),
      version: "2023-06-30",
      "Content-Type": "application/json",
      "x-merchantid": config.merchantId,
      "x-customerid": customerId,
      "x-resellerid": config.resellerId,
    },
  });

  const text = await response.text();
  let data: HdfcOrderStatusResponse = { order_id: orderId, status: "PENDING_VBV" };
  try {
    data = text ? JSON.parse(text) : data;
  } catch {
    throw new Error(`HDFC order status was not JSON: ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(
      `HDFC order status failed (${response.status}): ${JSON.stringify(data)}`,
    );
  }

  return data;
}

export function isHdfcPaymentSuccess(status?: string) {
  return status === "CHARGED";
}

export function verifyHdfcWebhookAuth(authorizationHeader: string | null) {
  const config = getHdfcConfig();
  if (!config.webhookUsername || !config.webhookPassword) {
    return process.env.NODE_ENV !== "production";
  }
  if (!authorizationHeader?.startsWith("Basic ")) return false;

  const decoded = Buffer.from(authorizationHeader.slice(6), "base64").toString(
    "utf8",
  );
  const [username, password] = decoded.split(":");
  return (
    username === config.webhookUsername && password === config.webhookPassword
  );
}

export function extractUtrFromOrderStatus(data: HdfcOrderStatusResponse) {
  return data.txn_detail?.txn_id || data.order_id;
}
