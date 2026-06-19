import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch product data from your API
    const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000";
    const productRes = await fetch(`${baseUrl}/api/products/${id}`);
    
    if (!productRes.ok) {
      return new ImageResponse(
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "white",
          fontSize: 48,
          fontWeight: "bold",
        }}>
          محصول یافت نشد
        </div>,
        { width: 1200, height: 630 }
      );
    }

    const product = await productRes.json();

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          padding: "60px 80px",
          justifyContent: "space-between",
        }}
      >
        {/* Top Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: "bold",
              background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
              padding: "12px 24px",
              borderRadius: "9999px",
              color: "white",
            }}
          >
            فروشگاه ویپ
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#a1a1aa",
            }}
          >
            Vape Store
          </div>
        </div>

        {/* Middle Section - Product Info */}
        <div style={{ display: "flex", gap: 48, alignItems: "center", marginTop: 40 }}>
          {/* Product Image Placeholder */}
          <div
            style={{
              width: 280,
              height: 280,
              background: "#2d2d3a",
              borderRadius: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
            }}
          >
            🛒
          </div>

          {/* Product Details */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            <h1
              style={{
                fontSize: 48,
                fontWeight: "bold",
                color: "white",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {product.title}
            </h1>
            <p
              style={{
                fontSize: 20,
                color: "#a1a1aa",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {product.description?.slice(0, 120)}
              {product.description?.length > 120 ? "..." : ""}
            </p>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: "bold",
                  color: "#a855f7",
                }}
              >
                {product.price.toLocaleString("fa-IR")} تومان
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: product.stock > 0 ? "#4ade80" : "#ef4444",
                  background: product.stock > 0 ? "#4ade801a" : "#ef44441a",
                  padding: "4px 12px",
                  borderRadius: 9999,
                }}
              >
                {product.stock > 0 ? "موجود" : "ناموجود"}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #2d2d3a",
            paddingTop: 24,
            marginTop: 20,
          }}
        >
          <div style={{ fontSize: 18, color: "#71717a" }}>
            مشاهده و خرید محصول
          </div>
          <div
            style={{
              fontSize: 18,
              color: "#a855f7",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {baseUrl}/product/{product.id}
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("OG Image generation error:", error);
    return new ImageResponse(
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          color: "white",
          fontSize: 48,
          fontWeight: "bold",
        }}
      >
        Vape Store
      </div>,
      { width: 1200, height: 630 }
    );
  }
}