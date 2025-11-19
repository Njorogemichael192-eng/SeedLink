"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle } from "lucide-react";

interface ProfilePictureUploaderProps {
  currentImageUrl?: string;
  onUploadComplete: (imageUrl: string) => void;
  disabled?: boolean;
}

export function ProfilePictureUploader({
  currentImageUrl,
  onUploadComplete,
  disabled = false,
}: ProfilePictureUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  const maxSizeBytes = 10 * 1024 * 1024;

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid format. Allowed: JPG, PNG, GIF, WebP`,
      };
    }
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File too large. Max 10MB`,
      };
    }
    return { valid: true };
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    if (e.dataTransfer?.files?.length === 1) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(false);

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Show preview
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    // Upload
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      const uploadedFile = data.uploads?.[0];

      if (uploadedFile?.url) {
        onUploadComplete(uploadedFile.url);
        setSuccess(true);
        // Clear preview after success
        setTimeout(() => {
          setPreviewUrl(null);
          setSuccess(false);
        }, 1500);
      } else {
        throw new Error("No upload data returned");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Current/Preview Image */}
      <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-white/40 shadow-lg flex-shrink-0 group">
        <Image
          src={previewUrl || currentImageUrl || "https://placehold.co/128x128?text=Avatar"}
          alt="Profile picture"
          fill
          className="object-cover"
          sizes="80px"
          priority
          unoptimized={
            !!previewUrl || (!!currentImageUrl && !currentImageUrl.startsWith("https://placehold.co"))
          }
        />
        {success && (
          <div className="absolute inset-0 bg-emerald-600/40 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 transition-all ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-900/40"
            : "border-white/30 bg-white/20 dark:bg-emerald-900/20"
        } ${disabled || isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label htmlFor="profile-picture-input" className="flex flex-col items-center justify-center gap-2 py-3">
          <Upload className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
            {isUploading ? "Uploading..." : "Change photo"}
          </span>
          <span className="text-xs text-emerald-900/70 dark:text-emerald-100/70">
            Drag or click to upload
          </span>
        </label>
        <input
          id="profile-picture-input"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
          aria-label="Upload profile picture"
        />
      </div>

      {/* Error Message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg border border-red-300/40 bg-red-100/40 p-3 text-red-800 text-sm flex items-center gap-2"
          >
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
