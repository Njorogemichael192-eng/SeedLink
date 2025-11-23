"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, AlertCircle, CheckCircle } from "lucide-react";

interface UploadedFile {
  file: File;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface ImageUploaderProps {
  onUploadComplete: (uploads: Array<{ url: string; fileId: string }>) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
  initialMessage?: string;
}

export function ImageUploader({
  onUploadComplete,
  maxFiles = 5,
  maxSizeMB = 10,
  disabled = false,
  initialMessage = "Click or drag images here",
}: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

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
        error: `File too large. Max ${maxSizeMB}MB`,
      };
    }
    return { valid: true };
  };

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setGlobalError(null);
      const fileArray = Array.from(newFiles);

      const validatedFiles: UploadedFile[] = fileArray
        .slice(0, maxFiles - files.length)
        .map((file) => {
          const validation = validateFile(file);
          return {
            file,
            preview: URL.createObjectURL(file),
            progress: 0,
            status: validation.valid ? ("pending" as const) : ("error" as const),
            error: validation.error,
          };
        });

      setFiles((prev) => [...prev, ...validatedFiles]);
    },
    [files.length, maxFiles]
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      if (e.dataTransfer?.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, isUploading, handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const uploadFiles = async () => {
    const filesToUpload = files.filter((f) => f.status === "pending" || f.status === "error");
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setGlobalError(null);

    const uploadedResults: Array<{ url: string; fileId: string }> = [];

    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending" && files[i].status !== "error") continue;

      const fileToUpload = files[i];

      // Update to uploading state
      setFiles((prev) => {
        const updated = [...prev];
        updated[i].status = "uploading";
        updated[i].progress = 0;
        return updated;
      });

      try {
        const formData = new FormData();
        formData.append("files", fileToUpload.file);

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

        if (uploadedFile) {
          uploadedResults.push(uploadedFile);
          setFiles((prev) => {
            const updated = [...prev];
            updated[i].status = "success";
            updated[i].progress = 100;
            return updated;
          });
        } else {
          throw new Error("No upload data returned");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        setFiles((prev) => {
          const updated = [...prev];
          updated[i].status = "error";
          updated[i].error = errorMessage;
          return updated;
        });
        setGlobalError(errorMessage);
      }
    }

    setIsUploading(false);

    if (uploadedResults.length > 0) {
      onUploadComplete(uploadedResults);
      // Clear successful uploads after a delay
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => f.status !== "success"));
      }, 1500);
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const hasErrors = files.some((f) => f.status === "error");
  const allSuccess = files.length > 0 && files.every((f) => f.status === "success");

  return (
    <div className="w-full space-y-3">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all ${
          dragActive
            ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-900/40"
            : "border-white/30 bg-white/20 dark:bg-emerald-900/20"
        } ${disabled || isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          multiple
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="hidden"
          aria-label="Upload images"
        />

        <div className="flex flex-col items-center justify-center gap-3 py-6">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse bg-emerald-400/20 rounded-full blur-xl" />
            <Upload className="relative w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
              {initialMessage}
            </p>
            <p className="text-xs text-emerald-900/70 dark:text-emerald-100/70 mt-1">
              Supported: JPG, PNG, GIF, WebP • Max {maxSizeMB}MB per file
            </p>
          </div>
          <button
            type="button"
            onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Browse files
          </button>
        </div>
      </div>

      {/* Global Error Message */}
      <AnimatePresence mode="wait">
        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2 rounded-lg border border-red-300/40 bg-red-100/40 p-3 text-red-800 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{globalError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      <AnimatePresence mode="popLayout">
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {files.map((file, idx) => (
              <motion.div
                key={`${idx}-${file.file.name}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex gap-3 rounded-lg border border-white/20 bg-white/10 dark:bg-emerald-900/10 p-3"
              >
                {/* Thumbnail */}
                <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-white/30">
                  <Image
                    src={file.preview}
                    alt={file.file.name}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="64px"
                  />
                </div>

                {/* File Info and Status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 truncate">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-emerald-900/70 dark:text-emerald-100/70">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {file.status === "pending" && (
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-400/30 border-t-emerald-600 animate-spin" />
                      )}
                      {file.status === "uploading" && (
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-400/30 border-t-emerald-600 animate-spin" />
                      )}
                      {file.status === "success" && (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      )}
                      {file.status === "error" && (
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {file.status === "uploading" && (
                    <div className="mt-2 h-1 w-full rounded-full bg-white/20 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                        initial={{ width: "0%" }}
                        animate={{ width: `${file.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}

                  {/* Error Message */}
                  {file.error && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {file.error}
                    </p>
                  )}
                </div>

                {/* Remove Button */}
                {!isUploading && file.status !== "success" && (
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="flex-shrink-0 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-700 dark:text-red-400 p-1 transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 justify-end pt-2"
        >
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={uploadFiles}
              disabled={isUploading || allSuccess}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {isUploading ? "Uploading..." : `Upload ${pendingCount} file${pendingCount !== 1 ? "s" : ""}`}
            </button>
          )}
          {allSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Upload complete</span>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
