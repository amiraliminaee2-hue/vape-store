
import { redirect } from "next/navigation";

export default function SignUpPage() {
  redirect("/auth/phone-signin");
}