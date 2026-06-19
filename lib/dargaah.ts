import axios, { AxiosError } from "axios";

const API_BASE_URL = "https://dargaah.com";
const MERCHANT_ID = process.env["DARGAAH_MERCHANT_ID"];

export async function createPaymentRequest(
  amount: number,
  orderId: number,
  callbackUrl: string,
  mobile?: string
): Promise<{ authority: string; redirectUrl: string }> {
  if (!MERCHANT_ID) {
    throw new Error("DARGAAH_MERCHANT_ID تنظیم نشده است");
  }

  const payload: Record<string, unknown> = {
    merchantID: MERCHANT_ID,
    amount: amount,
    callbackURL: callbackUrl,
    orderId: String(orderId),
    description: `پرداخت سفارش شماره ${orderId}`,
  };

  if (mobile) {
    payload["mobile"] = mobile;
  }

  try {
    const response = await axios.post(
      `${API_BASE_URL}/payment`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    const { status, authority } = response.data;

    if (status === 200 && authority) {
      const redirectUrl = `${API_BASE_URL}/ird/startpay/${authority}`;
      return { authority, redirectUrl };
    } else {
      throw new Error(response.data.message || `خطا در ایجاد پرداخت: کد ${status}`);
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("IranDargah create payment error:", error.response?.data);
      throw new Error(error.response?.data?.message || "خطا در اتصال به درگاه پرداخت");
    }
    throw error;
  }
}

export async function verifyPayment(
  orderId: number,
  authority: string,
  amount: number
): Promise<{ refId: string; message: string }> {
  if (!MERCHANT_ID) {
    throw new Error("DARGAAH_MERCHANT_ID تنظیم نشده است");
  }

  const payload = {
    merchantID: MERCHANT_ID,
    authority: authority,
    amount: amount,
    orderId: String(orderId),
  };

  try {
    const response = await axios.post(
      `${API_BASE_URL}/verification`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      }
    );

    const { status, refId, message } = response.data;

    if (status === 100) {
      return { refId: String(refId), message: message || "پرداخت با موفقیت انجام شد" };
    } else if (status === 101) {
      return { refId: String(refId), message: "این تراکنش قبلاً تایید شده است" };
    } else {
      throw new Error(message || `خطا در تأیید پرداخت: کد ${status}`);
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("IranDargah verify error:", error.response?.data);
      throw new Error(error.response?.data?.message || "خطا در تأیید پرداخت");
    }
    throw error;
  }
}