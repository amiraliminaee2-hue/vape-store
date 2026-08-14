// lib/cart.ts

export interface CartFlavor {
  flavorId: number;
  name: string;
  quantity: number;
  price: number;
  stock?: number;
  isActive?: boolean;
}

export interface CartItem {
  id: number;
  productId: number;
  title: string;
  price: number;
  discountPercent: number;
  quantity: number;

  /*
   * طعم‌های انتخاب‌شده برای این محصول
   */
  flavors?: CartFlavor[];

  /*
   * طعم‌های فعال قابل انتخاب
   */
  availableFlavors?: Array<{
    id: number;
    name: string;
    stock: number;
    isActive: boolean;
  }>;

  /*
   * آیا محصول دارای طعم است؟
   */
  hasFlavors?: boolean;

  /*
   * موجودی کلی محصول
   */
  stock?: number;

  /*
   * موجودی قابل استفاده برای این آیتم
   */
  availableStock?: number;

  /*
   * قیمت کل آیتم
   */
  totalPrice?: number;
}

// ============================================================
// دریافت سبد خرید
// ============================================================

export async function getCart(): Promise<CartItem[]> {
  const res = await fetch("/api/cart", {
    cache: "no-store",
  });

  if (!res.ok) {
    let message = "خطا در دریافت سبد خرید";

    try {
      const data = await res.json();

      if (data?.error) {
        message = data.error;
      }
    } catch {
      // پاسخ JSON نبود؛ پیام پیش‌فرض استفاده می‌شود.
    }

    throw new Error(message);
  }

  return res.json();
}

// ============================================================
// افزودن محصول به سبد
// ============================================================

export async function addToCart(
  productId: number,
  quantity = 1,
  flavorId?: number | null
) {
  const res = await fetch("/api/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "add",
      productId,
      quantity,
      flavorId:
        flavorId !== undefined
          ? flavorId
          : null,
    }),
  });

  if (!res.ok) {
    let message = "خطا در افزودن محصول";

    try {
      const data = await res.json();

      if (data?.error) {
        message = data.error;
      }
    } catch {
      // پاسخ JSON نبود؛ پیام پیش‌فرض استفاده می‌شود.
    }

    throw new Error(message);
  }

  return res.json();
}

// ============================================================
// حذف کامل محصول از سبد
// ============================================================

export async function removeFromCart(
  productId: number
) {
  const res = await fetch(
    `/api/cart/${productId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
      }),
    }
  );

  if (!res.ok) {
    let message = "خطا در حذف محصول";

    try {
      const data = await res.json();

      if (data?.error) {
        message = data.error;
      }
    } catch {
      // پاسخ JSON نبود؛ پیام پیش‌فرض استفاده می‌شود.
    }

    throw new Error(message);
  }

  return res.json();
}

// ============================================================
// افزایش تعداد محصول / طعم
// ============================================================

export async function increaseQuantity(
  productId: number,
  flavorId?: number | null
) {
  const res = await fetch(
    `/api/cart/${productId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "increase",

        /*
         * اگر محصول چند طعم داشته باشد،
         * API با این مقدار مشخص می‌کند
         * کدام طعم باید افزایش پیدا کند.
         */
        flavorId:
          flavorId !== undefined
            ? flavorId
            : null,
      }),
    }
  );

  if (!res.ok) {
    let message = "خطا در افزایش تعداد";

    try {
      const data = await res.json();

      if (data?.error) {
        message = data.error;
      }
    } catch {
      // پاسخ JSON نبود؛ پیام پیش‌فرض استفاده می‌شود.
    }

    throw new Error(message);
  }

  return res.json();
}

// ============================================================
// کاهش تعداد محصول / طعم
// ============================================================

export async function decreaseQuantity(
  productId: number,
  flavorId?: number | null
) {
  const res = await fetch(
    `/api/cart/${productId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "decrease",

        /*
         * اگر محصول چند طعم داشته باشد،
         * API با این مقدار مشخص می‌کند
         * کدام طعم باید کاهش پیدا کند.
         */
        flavorId:
          flavorId !== undefined
            ? flavorId
            : null,
      }),
    }
  );

  if (!res.ok) {
    let message = "خطا در کاهش تعداد";

    try {
      const data = await res.json();

      if (data?.error) {
        message = data.error;
      }
    } catch {
      // پاسخ JSON نبود؛ پیام پیش‌فرض استفاده می‌شود.
    }

    throw new Error(message);
  }

  return res.json();
}

// ============================================================
// پاکسازی کامل سبد خرید
// ============================================================

export async function clearCart() {
  const res = await fetch(
    "/api/cart",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "clear",
      }),
    }
  );

  if (!res.ok) {
    let message = "خطا در پاکسازی سبد";

    try {
      const data = await res.json();

      if (data?.error) {
        message = data.error;
      }
    } catch {
      // پاسخ JSON نبود؛ پیام پیش‌فرض استفاده می‌شود.
    }

    throw new Error(message);
  }

  return res.json();
}