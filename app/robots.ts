import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/account/",
          "/cart/",
          "/checkout/",
          "/payment/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/dashboard/",
          "/account/",
        ],
      },
    ],
    sitemap: "https://vapestore.ir/sitemap.xml",
    host: "https://vapestore.ir",
  };
}