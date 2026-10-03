import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  // Suspense is required because AuthForm uses useSearchParams
  return <Suspense><AuthForm mode="login" /></Suspense>;
}
