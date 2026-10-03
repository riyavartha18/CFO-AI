"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "./Button";

interface FileUploadProps {
  onUpload?: (file: File) => Promise<void> | void;
  acceptedFileTypes?: string;
  isUploading?: boolean;
}

export function FileUpload({
  onUpload,
  acceptedFileTypes = ".csv",
  isUploading = false,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "ready" | "success" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadStatus("error");
      setStatusMessage("Only CSV files are supported (.csv)");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadStatus("ready");
    setStatusMessage("Ready to upload for schema verification");
  };

  const handleClear = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setStatusMessage("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) return;

    if (onUpload) {
      try {
        await onUpload(selectedFile);
        setUploadStatus("success");
        setStatusMessage("CSV uploaded and sent to backend validation engine.");
      } catch (err: unknown) {
        setUploadStatus("error");
        setStatusMessage(
          err instanceof Error ? err.message : "Validation failed during upload."
        );
      }
    } else {
      // Standalone simulation for UI
      setUploadStatus("success");
      setStatusMessage("File queued for backend verification: " + selectedFile.name);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          dragActive
            ? "border-orange-500 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
            : selectedFile
            ? "border-zinc-700 bg-zinc-900/60"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleChange}
          className="hidden"
        />

        <div className="p-3.5 rounded-full bg-zinc-800/80 text-orange-400 mb-3 shadow-inner">
          <UploadCloud className="w-7 h-7" />
        </div>

        <p className="text-sm font-medium text-zinc-200 text-center">
          Drag & drop your quarterly financial CSV here, or{" "}
          <span className="text-orange-400 hover:underline">browse files</span>
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Supports 20 standardized financial columns (e.g. revenue_cr, cogs_cr, debts, cash)
        </p>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#151a24] border border-zinc-800">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 rounded bg-zinc-800 text-orange-400">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-zinc-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-zinc-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              type="button"
              size="sm"
              onClick={handleUploadClick}
              isLoading={isUploading}
            >
              Upload to Backend
            </Button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <div
          className={`flex items-start gap-2.5 p-3 rounded-lg text-xs ${
            uploadStatus === "success"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : uploadStatus === "error"
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              : "bg-zinc-800/60 text-zinc-300 border border-zinc-700/50"
          }`}
        >
          {uploadStatus === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : uploadStatus === "error" ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          ) : null}
          <div>
            <span className="font-semibold uppercase tracking-wider block text-[10px] mb-0.5">
              Validation Status
            </span>
            <span>{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
