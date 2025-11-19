"use client";
import { motion } from "framer-motion";

export type AccountTypeOption = "INDIVIDUAL" | "INSTITUTION" | "ORGANIZATION";

interface RegistrationTypeSelectorProps {
  value: AccountTypeOption;
  onChange: (value: AccountTypeOption) => void;
}

export function RegistrationTypeSelector({ value, onChange }: RegistrationTypeSelectorProps) {
  const options: { id: AccountTypeOption; title: string; description: string }[] = [
    {
      id: "INDIVIDUAL",
      title: "Individual",
      description: "Personal account for people booking seedlings and joining clubs.",
    },
    {
      id: "INSTITUTION",
      title: "Institution / Club",
      description: "Schools, community clubs, or institutions coordinating green actions.",
    },
    {
      id: "ORGANIZATION",
      title: "Organization / Company",
      description: "Organizations donating seedlings and supporting large-scale distribution.",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <motion.button
            key={opt.id}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(opt.id)}
            className={`text-left rounded-2xl border p-4 backdrop-blur-xl shadow-sm transition ${
              active
                ? "bg-emerald-700/80 border-emerald-400 text-emerald-50"
                : "bg-white/25 border-white/40 text-emerald-900 hover:bg-white/40"
            }`}
          >
            <div className="font-semibold mb-1">{opt.title}</div>
            <div className={`text-xs ${active ? "text-emerald-50/80" : "text-emerald-900/70"}`}>
              {opt.description}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
