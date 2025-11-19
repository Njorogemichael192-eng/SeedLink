"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { RegistrationTypeSelector } from "@/components/registration/type-selector";
import { DynamicRegistrationForm } from "@/components/registration/dynamic-form";

export default function OnboardingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "INSTITUTION" | "ORGANIZATION">("INDIVIDUAL");

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40">
        <div className="text-emerald-100 text-sm">Loading your account...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="backdrop-blur-xl bg-white/20 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900 mb-2">Complete your SeedLink profile</h1>
          <p className="text-sm text-emerald-900/80 mb-6">
            Choose your account type and tell us a bit more about yourself or your organization.
          </p>
          <RegistrationTypeSelector value={accountType} onChange={setAccountType} />
          <div className="mt-6">
            <DynamicRegistrationForm accountType={accountType} onComplete={() => router.push("/dashboard")} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
