"use client";

import { useUser } from "@clerk/nextjs";
import type { AccountTypeOption } from "@/components/registration/type-selector";
import { IndividualForm } from "@/components/registration/individual-form";
import { OrganizationForm } from "@/components/registration/organization-form";
import { InstitutionForm } from "@/components/registration/institution-form";

interface DynamicRegistrationFormProps {
  accountType: AccountTypeOption;
  onComplete: () => void;
}

export function DynamicRegistrationForm({ accountType, onComplete }: DynamicRegistrationFormProps) {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  if (!user) return null;

  if (accountType === "INDIVIDUAL") {
    return <IndividualForm defaultEmail={email} onSubmitted={onComplete} />;
  }

  if (accountType === "INSTITUTION") {
    return <InstitutionForm defaultEmail={email} onSubmitted={onComplete} />;
  }

  return <OrganizationForm onSubmitted={onComplete} />;
}
