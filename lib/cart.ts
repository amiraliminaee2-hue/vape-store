// lib/cart.ts

export interface CartItem {
  id: number;
  productId: number;
  title: string;
  price: number;
  discountPercent: number;
  quantity: number;
  flavors?: Array<{
    flavorId: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalPrice?: number;
}

export async function getCart(): Promise<CartItem[]> {
  const res = await fetch("/api/cart", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("خطا در دریافت سبد خرید");
  }

  return res.json();
}

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
      flavorId,
    }),
  });

  if (!res.ok) {
    throw new Error("خطا در افزودن محصول");
  }

  return res.json();
}

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
    throw new Error("خطا در حذف محصول");
  }

  return res.json();
}

export async function increaseQuantity(
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
        action: "increase",
      }),
    }
  );

  if (!res.ok) {
    throw new Error("خطا در افزایش تعداد");
  }

  return res.json();
}

export async function decreaseQuantity(
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
        action: "decrease",
      }),
    }
  );

  if (!res.ok) {
    throw new Error("خطا در کاهش تعداد");
  }

  return res.json();
}

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
    throw new Error("خطا در پاکسازی سبد");
  }

  return res.json();
}