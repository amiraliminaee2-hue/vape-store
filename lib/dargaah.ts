import axios, { AxiosError } from "axios";

// استفاده از محیط سندباکس زرین‌پال برای تست
const API_BASE_URL = "https://sandbox.zarinpal.com/pg/v4";
const MERCHANT_ID = process.env.DARGAAGH_MERCHANT_ID;

interface PaymentRequestPayload {
  merchant_id: string;
  amount: number;
  description: string;
  callback_url: string;
  mobile?: string;
}

interface PaymentRequestResponse {
  data: {
    code: number;
    message: string;
    authority: string;
    fee_type?: string;
    fee?: number;
  };
}

interface PaymentVerifyPayload {
  merchant_id: string;
  amount: number;
  authority: string;
}

interface PaymentVerifyResponse {
  data: {
    code: number;
    message: string;
    ref_id: number;
    card_pan?: string;
    card_hash?: string;
    fee_type?: string;
    fee?: number;
  };
}

export async function createPaymentRequest(
  amount: number,
  orderId: number,
  callbackUrl: string,
  mobile?: string
): Promise<{ authority: string; redirectUrl: string }> {
  console.log("=== Zarinpal Sandbox Create Payment ===");
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("MERCHANT_ID:", MERCHANT_ID);
  console.log("amount:", amount);
  console.log("orderId:", orderId);

  if (!MERCHANT_ID) {
    throw new Error("DARGAAGH_MERCHANT_ID تنظیم نشده است");
  }

  const payload: PaymentRequestPayload = {
    merchant_id: MERCHANT_ID,
    amount: amount,
    description: `پرداخت سفارش شماره ${orderId}`,
    callback_url: callbackUrl,
  };

  if (mobile) {
    payload.mobile = mobile;
  }

  console.log("Payload:", payload);

  try {
    const response = await axios.post<PaymentRequestResponse>(
      `${API_BASE_URL}/payment/request.json`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));

    const { code, message, authority } = response.data.data;

    if (code === 100) {
      const redirectUrl = `https://sandbox.zarinpal.com/pg/StartPay/${authority}`;
      return { authority, redirectUrl };
    } else {
      throw new Error(message || `خطا در ایجاد پرداخت: کد ${code}`);
    }
  } catch (error) {
    console.error("Zarinpal create payment error:", error);

    if (error instanceof AxiosError) {
      console.error("Axios error details:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    throw new Error("خطا در اتصال به درگاه پرداخت");
  }
}

export async function verifyPayment(
  orderId: number,
  authority: string,
  amount: number
): Promise<{ refId: string; message: string }> {
  console.log("=== Zarinpal Sandbox Verify Payment ===");
  console.log("orderId:", orderId);
  console.log("authority:", authority);
  console.log("amount:", amount);

  if (!MERCHANT_ID) {
    throw new Error("DARGAAGH_MERCHANT_ID تنظیم نشده است");
  }

  const payload: PaymentVerifyPayload = {
    merchant_id: MERCHANT_ID,
    amount: amount,
    authority: authority,
  };

  console.log("Verify Payload:", payload);

  try {
    const response = await axios.post<PaymentVerifyResponse>(
      `${API_BASE_URL}/payment/verify.json`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("Verify Response:", JSON.stringify(response.data, null, 2));

    const { code, message, ref_id } = response.data.data;

    if (code === 100) {
      return { refId: String(ref_id), message: message || "پرداخت با موفقیت انجام شد" };
    } else if (code === 101) {
      return { refId: String(ref_id), message: "این تراکنش قبلاً تایید شده است" };
    } else {
      throw new Error(message || `خطا در تأیید پرداخت: کد ${code}`);
    }
  } catch (error) {
    console.error("Zarinpal verify error:", error);

    if (error instanceof AxiosError) {
      console.error("Axios error details:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    throw new Error("خطا در تأیید پرداخت");
  }
}