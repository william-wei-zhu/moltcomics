"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const { completeEmailSignIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const email = window.localStorage.getItem("emailForSignIn") || "";
    if (!email) {
      setError("Please enter your email to complete sign-in.");
      return;
    }

    completeEmailSignIn(email)
      .then(() => router.push("/dashboard"))
      .catch((err) => setError(err.message || "Failed to verify"));
  }, [completeEmailSignIn, router]);

  if (error) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center">
      <p className="text-sm text-neutral-500">Verifying...</p>
    </div>
  );
}
