import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// ثبت فونت فارسی
try {
  Font.register({
    family: "Vazirmatn",
    fonts: [
      {
        src: `${process.cwd()}/public/fonts/Vazirmatn-Regular.ttf`,
        fontWeight: "normal",
      },
      {
        src: `${process.cwd()}/public/fonts/Vazirmatn-Bold.ttf`,
        fontWeight: "bold",
      },
    ],
  });
} catch {
  console.log("Vazirmatn font not found, using default font");
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Vazirmatn",
    direction: "rtl",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    borderBottom: 2,
    borderBottomColor: "#8b5cf6",
    paddingBottom: 15,
  },
  logoSection: {
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
  },
  titleSection: {
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: "#8b5cf6",
  },
  infoSection: {
    marginBottom: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8b5cf6",
    marginBottom: 10,
    borderRight: 3,
    borderRightColor: "#8b5cf6",
    paddingRight: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: 5,
  },
  infoLabel: {
    fontWeight: "bold",
    width: 100,
    color: "#4b5563",
  },
  infoValue: {
    flex: 1,
    color: "#1f2937",
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#8b5cf6",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 10,
    fontWeight: "bold",
  },
  tableHeaderText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  tableRowAlternate: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
  },
  colProduct: {
    width: "45%",
    textAlign: "right",
    paddingRight: 8,
  },
  colQuantity: {
    width: "15%",
    textAlign: "center",
  },
  colPrice: {
    width: "20%",
    textAlign: "right",
  },
  colTotal: {
    width: "20%",
    textAlign: "right",
    paddingLeft: 8,
  },
  totalSection: {
    marginTop: 20,
    borderTop: 2,
    borderTopColor: "#e5e7eb",
    paddingTop: 15,
    alignItems: "flex-end",
  },
  totalCard: {
    width: "50%",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
  },
  discountText: {
    fontSize: 12,
    color: "#10b981",
  },
  finalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  finalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8b5cf6",
  },
  footer: {
    marginTop: 35,
    textAlign: "center",
    fontSize: 9,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 15,
  },
});

interface Product {
  title: string;
}

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: Product;
}

interface Order {
  id: number;
  trackingNumber: string;
  transactionId: string | null;
  userName: string;
  phone: string;
  address: string;
  totalPrice: number;
  discountAmount: number;
  couponCode: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function InvoiceDocument({ order }: { order: Order }) {
  const subtotal = order.totalPrice + (order.discountAmount || 0);
  const hasDiscount = (order.discountAmount || 0) > 0;

  const formattedDate = new Date(order.createdAt).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logoSrc = `${process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"}/logo.png`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Image src={logoSrc} style={styles.logo} />
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>پاد بوشهر</Text>
            <Text style={styles.subtitle}>فاکتور رسمی خرید</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>اطلاعات سفارش</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>شماره سفارش:</Text>
            <Text style={styles.infoValue}>{order.trackingNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>تاریخ ثبت:</Text>
            <Text style={styles.infoValue}>{formattedDate}</Text>
          </View>
          {order.transactionId && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>شماره تراکنش:</Text>
              <Text style={styles.infoValue}>{order.transactionId}</Text>
            </View>
          )}
          <View style={[styles.infoRow, { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#e5e7eb" }]}>
            <Text style={styles.infoLabel}>نام مشتری:</Text>
            <Text style={styles.infoValue}>{order.userName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>شماره تماس:</Text>
            <Text style={styles.infoValue}>{order.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>آدرس:</Text>
            <Text style={styles.infoValue}>{order.address}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colProduct, styles.tableHeaderText]}>محصول</Text>
            <Text style={[styles.colQuantity, styles.tableHeaderText]}>تعداد</Text>
            <Text style={[styles.colPrice, styles.tableHeaderText]}>قیمت واحد</Text>
            <Text style={[styles.colTotal, styles.tableHeaderText]}>مبلغ</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={item.id} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlternate}>
              <Text style={styles.colProduct}>{item.product.title}</Text>
              <Text style={styles.colQuantity}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{item.price.toLocaleString("fa-IR")}</Text>
              <Text style={styles.colTotal}>{(item.price * item.quantity).toLocaleString("fa-IR")}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalCard}>
            <View style={styles.totalRow}>
              <Text>جمع کل:</Text>
              <Text>{subtotal.toLocaleString("fa-IR")} تومان</Text>
            </View>
            {hasDiscount && (
              <View style={[styles.totalRow, styles.discountText]}>
                <Text>تخفیف ({order.couponCode || "کد تخفیف"}):</Text>
                <Text>- {order.discountAmount?.toLocaleString("fa-IR")} تومان</Text>
              </View>
            )}
            <View style={styles.finalRow}>
              <Text style={styles.finalText}>مبلغ قابل پرداخت:</Text>
              <Text style={styles.finalText}>{order.totalPrice.toLocaleString("fa-IR")} تومان</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>با تشکر از خرید شما</Text>
          <Text>این فاکتور به عنوان مدرک خرید معتبر است.</Text>
        </View>
      </Page>
    </Document>
  );
}