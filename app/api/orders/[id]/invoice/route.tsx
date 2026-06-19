import { getPrisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import InvoiceDocument from "@/components/pdf/InvoiceDocument";

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    title: string;
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return Response.json(
        { error: "شناسه سفارش نامعتبر است" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return Response.json(
        { error: "سفارش یافت نشد" },
        { status: 404 }
      );
    }

    // تبدیل داده‌ها به فرمت مورد انتظار InvoiceDocument
    const formattedOrder = {
      id: order.id,
      trackingNumber: order.trackingNumber,
      transactionId: order.transactionId || null,
      userName: order.userName,
      phone: order.phone,
      address: order.address,
      totalPrice: order.totalPrice,
      discountAmount: order.discountAmount || 0,
      couponCode: order.couponCode || null,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item: OrderItem) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: {
          title: item.product.title,
        },
      })),
    };

    const pdf = await renderToBuffer(<InvoiceDocument order={formattedOrder} />);

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${order.trackingNumber}.pdf`,
      },
    });
  } catch (error) {
    console.error("Invoice Error:", error);

    return Response.json(
      { error: "خطا در تولید فاکتور" },
      { status: 500 }
    );
  }
}