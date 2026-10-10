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
            ? "border-blue-500 bg-blue-50/50 shadow-xs"
            : selectedFile
            ? "border-slate-300 bg-white shadow-xs"
            : "border-slate-200 hover:border-slate-300 bg-slate-50/70"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleChange}
          className="hidden"
        />

        <div className="p-3.5 rounded-full bg-blue-50 text-blue-600 mb-3 shadow-xs">
          <UploadCloud className="w-7 h-7" />
        </div>

        <p className="text-sm font-medium text-slate-800 text-center">
          Drag & drop your quarterly financial CSV here, or{" "}
          <span className="text-blue-600 hover:underline">browse files</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Supports 20 standardized financial columns (e.g. revenue_cr, cogs_cr, debts, cash)
        </p>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 rounded bg-slate-100 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
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
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Upload to Backend
            </Button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
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
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : uploadStatus === "error"
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "bg-slate-50 text-slate-700 border border-slate-200"
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
