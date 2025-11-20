"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KENYA_COUNTIES, KenyaCounty } from "@/components/registration/kenya-counties";

const kenyaPhoneRegex = /^(?:\+254|0)(7\d{8})$/;

const IndividualSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phoneNumber: z.string().regex(kenyaPhoneRegex, "Enter a valid Kenyan phone number"),
  clubMembership: z.enum(["yes", "no"]),
  clubName: z.string().optional(),
  institutionName: z.string().optional(),
  county: z.custom<KenyaCounty>(),
  otherDetails: z.string().max(2000).optional(),
}).superRefine((data, ctx) => {
  if (data.clubMembership === "yes" && !data.clubName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["clubName"],
      message: "Club name is required when club membership is Yes",
    });
  }
});

export type IndividualFormValues = z.infer<typeof IndividualSchema>;

interface IndividualFormProps {
  defaultEmail: string;
  onSubmitted: () => void;
}

export function IndividualForm({ defaultEmail, onSubmitted }: IndividualFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IndividualFormValues>({
    resolver: zodResolver(IndividualSchema),
    defaultValues: {
      fullName: "",
      email: defaultEmail,
      phoneNumber: "",
      clubMembership: "no",
      county: undefined as unknown as KenyaCounty,
      otherDetails: "",
    },
  });

  const clubMembership = watch("clubMembership");

  useEffect(() => {
    if (!KENYA_COUNTIES.includes(watch("county") as KenyaCounty)) {
      setValue("county", KENYA_COUNTIES[0]);
    }
  }, [setValue, watch]);

  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: IndividualFormValues) => {
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountType: "INDIVIDUAL", data: values }),
      });
      if (res.ok) {
        onSubmitted();
      } else {
        const error = await res.json();
        setError(`Error saving profile: ${error.error || "Unknown error"}`);
      }
    } catch (err) {
      setError("Failed to save profile. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-sm text-emerald-900">Full name</span>
          <input
            type="text"
            {...register("fullName")}
            className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
          />
          {errors.fullName && <p className="text-xs text-red-700">{errors.fullName.message}</p>}
        </label>
        <label className="space-y-1">
          <span className="text-sm text-emerald-900">Email</span>
          <input
            type="email"
            {...register("email")}
            className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
          />
          {errors.email && <p className="text-xs text-red-700">{errors.email.message}</p>}
        </label>
        <label className="space-y-1">
          <span className="text-sm text-emerald-900">Phone number</span>
          <input
            type="tel"
            {...register("phoneNumber")}
            placeholder="07xxxxxxxx or +2547xxxxxxxx"
            className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
          />
          {errors.phoneNumber && <p className="text-xs text-red-700">{errors.phoneNumber.message}</p>}
        </label>
        <label className="space-y-1">
          <span className="text-sm text-emerald-900">County / Location</span>
          <select
            {...register("county")}
            className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
          >
            {KENYA_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.county && <p className="text-xs text-red-700">County is required</p>}
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-emerald-900">Are you a member of a club?</span>
        <div className="flex gap-4 text-sm">
          <label className="inline-flex items-center gap-1">
            <input type="radio" value="yes" {...register("clubMembership")} />
            <span>Yes</span>
          </label>
          <label className="inline-flex items-center gap-1">
            <input type="radio" value="no" {...register("clubMembership")} />
            <span>No</span>
          </label>
        </div>
        {errors.clubMembership && (
          <p className="text-xs text-red-700">{errors.clubMembership.message}</p>
        )}
      </div>

      {clubMembership === "yes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1">
            <span className="text-sm text-emerald-900">Club name</span>
            <input
              type="text"
              {...register("clubName")}
              className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
            />
            {errors.clubName && <p className="text-xs text-red-700">{errors.clubName.message}</p>}
          </label>
          <label className="space-y-1">
            <span className="text-sm text-emerald-900">Institution name (if applicable)</span>
            <input
              type="text"
              {...register("institutionName")}
              className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
            />
          </label>
        </div>
      )}

      <label className="space-y-1 block">
        <span className="text-sm text-emerald-900">Any other relevant detail (optional)</span>
        <textarea
          rows={3}
          {...register("otherDetails")}
          className="w-full rounded-lg bg-white/70 border border-white/40 p-2 text-sm"
        />
        {errors.otherDetails && <p className="text-xs text-red-700">{errors.otherDetails.message}</p>}
      </label>

      {error && (
        <div className="rounded-lg bg-red-100 border border-red-300 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

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
