import { getPrisma } from "@/lib/prisma";
import BanUserButton from "@/components/admin/BanUserButton";

interface UserProfile {
  isBanned: boolean;
  banExpiry: Date | null;
}

interface UserOrder {
  id: number;
  totalPrice: number;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: Date;
  profile: UserProfile | null;
  orders: UserOrder[];
}

export default async function AdminCustomersPage() {
  const prisma = await getPrisma();
  
  const users: User[] = await prisma.user.findMany({
    include: { 
      profile: true, 
      orders: { 
        select: { id: true, totalPrice: true } 
      } 
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">مشتریان</h1>
        <p className="mt-2 text-zinc-500">{users.length} کاربر</p>
      </div>
      <div className="rounded-3xl border border-white/10 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-6 gap-4 px-6 py-4 bg-white/5 text-zinc-400 text-sm font-medium">
            <span className="col-span-2">کاربر</span>
            <span>تعداد سفارش</span>
            <span>مجموع خرید</span>
            <span>تاریخ عضویت</span>
            <span>وضعیت</span>
            <span>عملیات</span>
          </div>
          <div className="divide-y divide-white/5">
            {users.map((user: User) => {
              const orderCount = user.orders.length;
              const totalSpent = user.orders.reduce((s: number, o: UserOrder) => s + o.totalPrice, 0);
              const isBanned = user.profile?.isBanned || false;
              const banExpiry = user.profile?.banExpiry?.toISOString() || null;
              
              const userEmail = user.email || "—";
              const userName = user.name || userEmail || "کاربر مهمان";

              return (
                <div key={user.id} className="grid grid-cols-6 gap-4 px-6 py-4 items-center hover:bg-white/5">
                  <div className="col-span-2">
                    <p className="font-medium">{userName}</p>
                    <p className="text-sm text-zinc-500">{userEmail}</p>
                  </div>
                  <span>{orderCount}</span>
                  <span className="text-emerald-400">{totalSpent.toLocaleString("fa-IR")} تومان</span>
                  <span className="text-zinc-500 text-sm">{new Date(user.createdAt).toLocaleDateString("fa-IR")}</span>
                  <span>{isBanned ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">بن شده</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">فعال</span>}</span>
                  <div><BanUserButton userId={user.id} userName={userName} isBanned={isBanned} banExpiry={banExpiry} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}