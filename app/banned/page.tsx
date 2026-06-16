import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const prisma = await getPrisma();
const data = await prisma.user.findMany();
import Link from "next/link";

export default async function BannedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">⛔ دسترسی غیرمجاز</h1>
          <p className="text-zinc-400">شما به این صفحه دسترسی ندارید.</p>
          <Link href="/" className="inline-block mt-6 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500">
            بازگشت به خانه
          </Link>
        </div>
      </div>
    );
  }
  
  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { banReason: true, bannedAt: true, banExpiry: true },
  });
  
  const isPermanent = !profile?.banExpiry;
  const expiryDate = profile?.banExpiry ? new Date(profile.banExpiry).toLocaleDateString("fa-IR") : null;
  
  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="max-w-md w-full text-center bg-red-500/10 border border-red-500/30 rounded-3xl p-8">
        <div className="text-6xl mb-6">⛔</div>
        <h1 className="text-3xl font-bold text-red-500 mb-4">حساب کاربری شما مسدود شده است</h1>
        <p className="text-zinc-300 mb-4">
          {isPermanent 
            ? "حساب کاربری شما به طور دائمی مسدود شده است."
            : `حساب کاربری شما تا تاریخ ${expiryDate} مسدود شده است.`
          }
        </p>
        {profile?.banReason && (
          <div className="bg-white/5 rounded-xl p-3 mb-6">
            <p className="text-sm text-zinc-400">دلیل مسدودیت:</p>
            <p className="text-zinc-300">{profile.banReason}</p>
          </div>
        )}
        <p className="text-sm text-zinc-500 mb-6">
          در صورت اعتراض به این تصمیم، می‌توانید با پشتیبانی تماس بگیرید.
        </p>
        <Link href="/" className="inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors">
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}