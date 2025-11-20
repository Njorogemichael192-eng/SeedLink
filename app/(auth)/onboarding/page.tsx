"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { RegistrationTypeSelector } from "@/components/registration/type-selector";
import { DynamicRegistrationForm } from "@/components/registration/dynamic-form";

export default function OnboardingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [accountType, setAccountType] = useState<"INDIVIDUAL" | "INSTITUTION" | "ORGANIZATION">("INDIVIDUAL");
  const [successMessage, setSuccessMessage] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleComplete = () => {
    setSuccessMessage(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40">
        <div className="text-emerald-100 text-sm">Loading your account...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-emerald-800 via-emerald-600/40 to-sky-700/40 p-4 sm:p-8">
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            <span className="text-xl">✓</span>
            <span>Your details have been saved successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            <DynamicRegistrationForm accountType={accountType} onComplete={handleComplete} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
