// lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getPrisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      id: "phone-otp",
      name: "phone-otp",
      credentials: {
        phone: { label: "شماره تلفن", type: "tel" },
      },
      async authorize(credentials) {
        if (!credentials?.phone) {
          throw new Error("شماره تلفن الزامی است");
        }

        const phoneRegex = /^09[0-9]{9}$/;
        if (!phoneRegex.test(credentials.phone)) {
          throw new Error("شماره تلفن نامعتبر است");
        }

        const prisma = await getPrisma();
        
        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
          include: { profile: true },
        });

        if (!user) {
          throw new Error("کاربر یافت نشد");
        }

        if (user.profile?.isBanned) {
          if (!user.profile.banExpiry || new Date(user.profile.banExpiry) > new Date()) {
            throw new Error("حساب کاربری شما مسدود شده است");
          }
        }

        // ✅ فقط id و phone برگردانده می‌شوند
        return {
          id: user.id,
          phone: user.phone,
        };
      }
    })
  ],
  pages: {
    signIn: "/auth/phone-signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.phone = token.phone as string;
        // name حذف شد
      }
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env["NEXTAUTH_SECRET"] || "",
  debug: process.env["NODE_ENV"] === "development",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env["NODE_ENV"] === "production",
      },
    },
  },
};