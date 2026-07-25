import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
} from "axios";
import crypto from "crypto";

const SANDBOX_MODE = process.env.IRANDARGAH_SANDBOX === "true";

const API_BASE_URL = (
  SANDBOX_MODE
    ? "https://sandbox.irandargah.com"
    : process.env.IRANDARGAH_BASE_URL ||
      "https://ipg.irandargah.com"
).replace(/\/+$/, "");

const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 3;

interface PaymentRequest {
  amount: number;
  order_id: string;
  callback_url: string;
  description: string;
  mobile?: string;
  action?: "GET" | "POST";
}

interface PaymentResponse {
  success: boolean;
  status_code: number;
  message: string;
  data?: {
    transaction?: {
      authority: string;
      gateway_url: string;
    };
  };
}

interface VerificationResponse {
  success: boolean;
  status_code: number;
  message: string;
  data?: {
    verification?: {
      ref_id: string | number;
    };
  };
}

function getApiToken(): string {
  const token = process.env.IRANDARGAH_API_KEY;

  if (!token) {
    throw new Error("IRANDARGAH_API_KEY تنظیم نشده است.");
  }

  return token;
}

function maskToken(token: string) {
  if (token.length < 10) return "********";

  return (
    token.substring(0, 6) +
    "********" +
    token.substring(token.length - 4)
  );
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

async function getIdempotencyKey(): Promise<string> {
  try {
    console.log("📥 Requesting Idempotency-Key");

    const response = await api.get("/v2/idempotency-key", {
      headers: {
        Authorization: `Bearer ${getApiToken()}`,
      },
    });

    console.log("📤 Idempotency Response:", response.data);

    if (
  response.data?.success &&
  response.data?.idempotency_key
) {
  console.log(
    "✅ Using server Idempotency-Key:",
    response.data.idempotency_key
  );

  return response.data.idempotency_key;
}

    console.warn(
      "⚠️ Server did not return idempotency key. Using UUID."
    );

    return crypto.randomUUID();
  } catch {
    console.warn(
      "⚠️ Could not fetch Idempotency-Key. Using UUID."
    );

    return crypto.randomUUID();
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestWithRetry<T>(
  callback: () => Promise<AxiosResponse<T>>
): Promise<AxiosResponse<T>> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `🚀 IranDargah Attempt ${attempt}/${MAX_RETRIES}`
      );

      return await callback();
    } catch (err) {
      lastError = err;

      if (!(err instanceof AxiosError)) {
        throw err;
      }

      const status = err.response?.status;

      console.error("❌ Status:", status);

      console.error("❌ Headers:", err.response?.headers);

      console.error("❌ Response:", err.response?.data);

      if (status !== 503) {
        throw err;
      }

      if (attempt === MAX_RETRIES) {
        break;
      }

      const delay = Math.pow(2, attempt) * 1000;

      console.log(
        `⏳ Service unavailable. Retry after ${delay} ms`
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

function buildHeaders(idempotencyKey: string) {
  return {
    Authorization: `Bearer ${getApiToken()}`,
    "Idempotency-Key": idempotencyKey,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function toRial(amount: number) {
  return amount * 10;
}
export async function createPaymentRequest(
  amount: number,
  orderId: number,
  callbackUrl: string,
  mobile?: string
): Promise<{
  authority: string;
  redirectUrl: string;
}> {
  const idempotencyKey = await getIdempotencyKey();

  const payload: PaymentRequest = {
  amount: toRial(amount),
  order_id: String(orderId),
  callback_url: callbackUrl,
  description: `پرداخت سفارش شماره ${orderId}`,
  mobile,
  action: "GET",
};

  console.log("");
  console.log("========================================");
  console.log("📤 IranDargah Create Payment");
  console.log("========================================");
  console.log("Base URL:", API_BASE_URL);
  console.log("Sandbox:", SANDBOX_MODE);
  console.log("Endpoint:", "/v2/payments");
  console.log("Token:", maskToken(getApiToken()));
  console.log("Idempotency-Key:", idempotencyKey);
  console.log("Payload:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("========================================");

  try {
    const response = await requestWithRetry<PaymentResponse>(() =>
      api.post("/v2/payments", payload, {
        headers: buildHeaders(idempotencyKey),
      })
    );

    console.log("");
    console.log("========================================");
    console.log("📥 IranDargah Response");
    console.log("========================================");
    console.log("Status:", response.status);
    console.log("Headers:", response.headers);
    console.log("Data:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("========================================");

    const contentType = String(
      response.headers["content-type"] || ""
    );

    if (!contentType.includes("application/json")) {
      console.error("❌ HTML Response Received");
      console.error(response.data);

      throw new Error(
        "سرور ایران‌درگاه پاسخ HTML برگرداند."
      );
    }

    const data = response.data;

    if (
      data.success &&
      data.status_code === 200 &&
      data.data?.transaction
    ) {
      console.log("✅ Payment Created Successfully");
      console.log("========================================");
      console.log("Authority:", data.data.transaction.authority);
      console.log("Gateway URL:", data.data.transaction.gateway_url);
      console.log("Full IranDargah Response:");
      console.log(JSON.stringify(data, null, 2));
      console.log("========================================");

      return {
        authority: data.data.transaction.authority,
        redirectUrl: data.data.transaction.gateway_url,
      };
    }

    console.error("❌ API Error");
    console.error(JSON.stringify(data, null, 2));

    throw new Error(
      data.message || "ایجاد تراکنش ناموفق بود."
    );
  } catch (err) {
    if (err instanceof AxiosError) {
      const status = err.response?.status;

      console.log("");
      console.log("========================================");
      console.log("🚨 Axios Error");
      console.log("========================================");
      console.log("Status:", status);
      console.log("Headers:", err.response?.headers);
      console.log("Response:");
      console.log(
        JSON.stringify(err.response?.data, null, 2)
      );
      console.log("========================================");

      switch (status) {
        case 400:
          throw new Error("درخواست نامعتبر است.");

        case 401:
          throw new Error(
            "API Key معتبر نیست یا منقضی شده است."
          );

        case 403:
          throw new Error(
            "دسترسی به API ایران‌درگاه مجاز نیست."
          );

        case 404:
          throw new Error(
            "آدرس API ایران‌درگاه یافت نشد."
          );

        case 409:
          throw new Error(
            "Idempotency-Key تکراری است."
          );

        case 422:
          throw new Error(
            "اطلاعات ارسال شده معتبر نیست."
          );

        case 429:
          throw new Error(
            "تعداد درخواست‌ها بیش از حد مجاز است."
          );

        case 500:
          throw new Error(
            "خطای داخلی سرور ایران‌درگاه."
          );

        case 503:
          throw new Error(
            "سرویس بانکی یا کارمزد موقتاً در دسترس نیست."
          );

        default:
          throw new Error(
            typeof err.response?.data === "object"
              ? err.response?.data?.message ||
                  "خطا در ارتباط با ایران‌درگاه."
              : "خطا در ارتباط با ایران‌درگاه."
          );
      }
    }

    throw err;
  }
}
export async function verifyPayment(
  orderId: number,
  authority: string,
  amount: number
): Promise<{
  refId: string;
  message: string;
}> {
  const idempotencyKey = await getIdempotencyKey();

  const payload = {
  authority,
  amount,
  order_id: String(orderId),
};

  console.log("");
  console.log("========================================");
  console.log("📤 IranDargah Verify Payment");
  console.log("========================================");
  console.log("Order:", orderId);
  console.log("Authority:", authority);
  console.log("Payload:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("========================================");

  try {
    const response = await requestWithRetry<VerificationResponse>(() =>
      api.post("/v2/verifications", payload, {
        headers: buildHeaders(idempotencyKey),
      })
    );

    console.log("");
    console.log("========================================");
    console.log("📥 Verify Response");
    console.log("========================================");
    console.log("Status:", response.status);
    console.log("Headers:", response.headers);
    console.log("Data:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("========================================");

    const contentType = String(
      response.headers["content-type"] || ""
    );

    if (!contentType.includes("application/json")) {
      throw new Error("پاسخ HTML از سرور دریافت شد.");
    }

    const data = response.data;

    if (
      data.success &&
      data.status_code === 200 &&
      data.data?.verification
    ) {
      return {
        refId: String(data.data.verification.ref_id),
        message:
          data.message || "پرداخت با موفقیت تأیید شد",
      };
    }

    throw new Error(
      data.message || "تأیید پرداخت ناموفق بود."
    );
  } catch (err) {
    if (err instanceof AxiosError) {
      const status = err.response?.status;

      console.log("");
      console.log("========================================");
      console.log("🚨 Verification Error");
      console.log("========================================");
      console.log("Status:", status);
      console.log("Headers:", err.response?.headers);
      console.log("Response:");
      console.log(
        JSON.stringify(err.response?.data, null, 2)
      );
      console.log("========================================");

      switch (status) {
        case 400:
          throw new Error("درخواست تأیید نامعتبر است.");

        case 401:
          throw new Error(
            "کلید API معتبر نیست."
          );

        case 403:
          throw new Error(
            "دسترسی برای تأیید پرداخت وجود ندارد."
          );

        case 404:
          throw new Error(
            "Authority یافت نشد."
          );

        case 409:
          throw new Error(
            "تراکنش قبلاً تأیید شده است."
          );

        case 422:
          throw new Error(
            "اطلاعات تأیید معتبر نیست."
          );

        case 429:
          throw new Error(
            "تعداد درخواست‌ها بیش از حد مجاز است."
          );

        case 500:
          throw new Error(
            "خطای داخلی سرور ایران‌درگاه."
          );

        case 503:
          throw new Error(
            "سرویس بانکی موقتاً در دسترس نیست."
          );

        default:
          throw new Error(
            typeof err.response?.data === "object"
              ? err.response?.data?.message ||
                  "خطا در تأیید پرداخت."
              : "خطا در تأیید پرداخت."
          );
      }
    }

    throw err;
  }
}