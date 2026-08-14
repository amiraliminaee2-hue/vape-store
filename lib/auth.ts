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
        phone: {
          label: "شماره تلفن",
          type: "tel",
        },
      },

      async authorize(credentials) {
        if (!credentials?.phone) {
          throw new Error("شماره تلفن الزامی است");
        }

        const phone = credentials.phone.trim();

        const phoneRegex = /^09[0-9]{9}$/;

        if (!phoneRegex.test(phone)) {
          throw new Error("شماره تلفن نامعتبر است");
        }

        const prisma = await getPrisma();

        const user = await prisma.user.findUnique({
          where: {
            phone,
          },
          include: {
            profile: true,
          },
        });

        if (!user) {
          throw new Error("کاربر یافت نشد");
        }

        if (user.profile?.isBanned) {
          if (
            !user.profile.banExpiry ||
            new Date(user.profile.banExpiry) > new Date()
          ) {
            throw new Error("حساب کاربری شما مسدود شده است");
          }
        }

        console.log("✅ NextAuth authorize user:", {
          id: user.id,
          phone: user.phone,
          name: user.name,
        });

        return {
          id: user.id,
          phone: user.phone,
          name: user.name ?? null,
        };
      },
    }),
  ],

  pages: {
    signIn: "/auth/phone-signin",
  },

  callbacks: {
    async jwt({ token, user }) {
      /*
       * اولین بار که کاربر Login می‌کند،
       * اطلاعات User داخل JWT ذخیره می‌شود.
       */
      if (user) {
        token.id = user.id;
        token.phone = user.phone;

        console.log("🔐 JWT created for user:", {
          id: user.id,
          phone: user.phone,
        });

        return token;
      }

      /*
       * در درخواست‌های بعدی user وجود ندارد
       * و اطلاعات از JWT قبلی خوانده می‌شود.
       *
       * چون دیتابیس ممکن است Reset شده باشد،
       * User را دوباره بررسی می‌کنیم.
       */
      if (token.id) {
        try {
          const prisma = await getPrisma();

          const existingUser = await prisma.user.findUnique({
            where: {
              id: token.id as string,
            },
            select: {
              id: true,
              phone: true,
              name: true,
            },
          });

          /*
           * اگر User داخل دیتابیس وجود نداشته باشد،
           * این JWT دیگر معتبر نیست.
           */
          if (!existingUser) {
            console.warn(
              "⚠️ JWT belongs to a user that no longer exists:",
              token.id
            );

            return {
              ...token,
              id: undefined,
              phone: undefined,
              name: undefined,
              error: "UserNotFound",
            };
          }

          /*
           * اطلاعات جدید User را روی Token قرار می‌دهیم.
           */
          token.id = existingUser.id;
          token.phone = existingUser.phone;
          token.name = existingUser.name ?? null;

          return token;
        } catch (error) {
          console.error("❌ JWT user validation error:", error);

          return {
            ...token,
            id: undefined,
            phone: undefined,
            name: undefined,
            error: "UserValidationError",
          };
        }
      }

      return token;
    },

    async session({ session, token }) {
      /*
       * اگر JWT مربوط به User حذف‌شده باشد،
       * Session را بدون User برمی‌گردانیم.
       */
      if (
        token.error ||
        !token.id ||
        typeof token.id !== "string"
      ) {
        console.warn("⚠️ Invalid or expired user session");

        return {
          ...session,
          user: undefined,
        };
      }

      if (session.user) {
        session.user.id = token.id;
        session.user.phone =
          typeof token.phone === "string"
            ? token.phone
            : null;

        session.user.name =
          typeof token.name === "string"
            ? token.name
            : null;
      }

      return session;
    },
  },

  session: {
    strategy: "jwt",

    /*
     * Session حداکثر 30 روز معتبر است.
     */
    maxAge: 30 * 24 * 60 * 60,
  },

  /*
   * این مقدار باید حتماً در ENV پارس‌پک وجود داشته باشد.
   */
  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",

  /*
   * مهم:
   *
   * Cookie را دستی تعریف نمی‌کنیم.
   * NextAuth خودش بر اساس HTTPS/Production
   * Cookie امن را انتخاب می‌کند.
   */
};
