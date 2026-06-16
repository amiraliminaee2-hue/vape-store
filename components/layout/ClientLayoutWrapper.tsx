"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/providers/SmoothScroll";

export default function ClientLayoutWrapper() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdminPage) {
      document.body.classList.add("admin-page");
    } else {
      document.body.classList.remove("admin-page");
    }
  }, [isAdminPage]);

  if (isAdminPage) {
    return null;
  }

  return (
    <>
      <SmoothScroll />
      <Navbar />
    </>
  );
}