"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const OrganizationSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  seedsDonatedCount: z
    .number({ invalid_type_error: "Enter a number" })
    .int("Must be a whole number")
    .positive("Must be at least 1"),
  distributionArea: z.string().min(1, "Distribution area is required"),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
});

export type OrganizationFormValues = z.infer<typeof OrganizationSchema>;

interface OrganizationFormProps {
  onSubmitted: () => void;
}

export function OrganizationForm({ onSubmitted }: OrganizationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(OrganizationSchema),
    defaultValues: {
      organizationName: "",
      seedsDonatedCount: 1,
      distributionArea: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  const onSubmit = async (values: OrganizationFormValues) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountType: "ORGANIZATION", data: values }),
    });
    if (res.ok) {
      onSubmitted();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-sm text-emerald-900">Organization name</span>
          <input
            type="text"
            {...register("organizationName")}
            className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
          />
          {errors.organizationName && (
            <p className="text-xs text-red-700">{errors.organizationName.message}</p>
          )}
        </label>
        <label className="space-y-1">
          <span className="text-sm text-emerald-900">Seeds donated count</span>
          <input
            type="number"
            min={1}
            {...register("seedsDonatedCount", { valueAsNumber: true })}
            className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
          />
          {errors.seedsDonatedCount && (
            <p className="text-xs text-red-700">{errors.seedsDonatedCount.message}</p>
          )}
        </label>
      </div>

      <label className="space-y-1 block">
        <span className="text-sm text-emerald-900">Distribution area</span>
        <input
          type="text"
          {...register("distributionArea")}
          placeholder="Which areas will you distribute free seedlings?"
          className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
        />
        {errors.distributionArea && (
          <p className="text-xs text-red-700">{errors.distributionArea.message}</p>
        )}
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-sm text-emerald-900">Contact email (optional)</span>
          <input
            type="email"
            {...register("contactEmail")}
            className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
          />
          {errors.contactEmail && (
            <p className="text-xs text-red-700">{errors.contactEmail.message}</p>
          )}
        </label>
        <label className="space-y-1">
          <span className="text-sm text-emerald-900">Contact phone (optional)</span>
          <input
            type="tel"
            {...register("contactPhone")}
            className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
          />
          {errors.contactPhone && (
            <p className="text-xs text-red-700">{errors.contactPhone.message}</p>
          )}
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-full bg-emerald-700 text-white text-sm shadow hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
        >
          {isSubmitting ? "Saving..." : "Continue to dashboard"}
        </button>
      </div>
    </form>
  );
}
