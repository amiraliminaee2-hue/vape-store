// lib/dargaah.ts
import axios, { AxiosError } from "axios";
import crypto from "crypto";

const API_BASE_URL =
  process.env.IRANDARGAH_BASE_URL || "https://api.irandargah.com";

function getApiToken() {
  const token = process.env.IRANDARGAH_API_KEY;

  if (!token) {
    throw new Error("IRANDARGAH_API_KEY تنظیم نشده است");
  }

  return token;
}

const createHeaders = () => ({
  Authorization: `Bearer ${getApiToken()}`,
  "Content-Type": "application/json",
  "Idempotency-Key": crypto.randomUUID(),
});

const toRial = (amount: number) => amount * 10;

export async function createPaymentRequest(
  amount: number,
  orderId: number,
  callbackUrl: string,
  mobile?: string
): Promise<{
  authority: string;
  redirectUrl: string;
}> {
  try {
    const payload: Record<string, unknown> = {
      amount: toRial(amount),
      order_id: String(orderId),
      callback_url: callbackUrl,
      description: `پرداخت سفارش شماره ${orderId}`,
    };

    if (mobile) {
      payload.mobile = mobile;
    }

    console.log("📤 Sending to IranDargah:", {
      url: `${API_BASE_URL}/v2/payments`,
      amount: toRial(amount),
      orderId: String(orderId),
      callbackUrl,
    });

    const response = await axios.post(
      `${API_BASE_URL}/v2/payments`,
      payload,
      {
        headers: createHeaders(),
        timeout: 30000,
      }
    );

    const data = response.data;
    console.log("📥 IranDargah response:", JSON.stringify(data, null, 2));

    if (
      data?.success &&
      data?.status_code === 200 &&
      data?.data?.transaction
    ) {
      return {
        authority: data.data.transaction.authority,
        redirectUrl: data.data.transaction.gateway_url,
      };
    }

    throw new Error(data?.message || "خطا در ایجاد تراکنش");
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(
        "❌ IranDargah create payment error:",
        error.response?.data || error.message
      );
      console.error("❌ Status:", error.response?.status);
      console.error("❌ Headers:", error.response?.headers);

      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "خطا در اتصال به ایران درگاه"
      );
    }

    throw error;
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
  try {
    const response = await axios.post(
      `${API_BASE_URL}/v2/verifications`,
      {
        authority,
        amount: toRial(amount),
        order_id: String(orderId),
      },
      {
        headers: createHeaders(),
        timeout: 30000,
      }
    );

    const data = response.data;

    if (
      data?.success &&
      data?.status_code === 200 &&
      data?.data?.verification
    ) {
      return {
        refId: String(data.data.verification.ref_id),
        message: data.message || "پرداخت با موفقیت تأیید شد",
      };
    }

    throw new Error(data?.message || "تأیید پرداخت ناموفق بود");
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(
        "❌ IranDargah verification error:",
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "خطا در تأیید پرداخت"
      );
    }

    throw error;
  }
}