import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  helperText,
  error,
  icon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-slate-700 tracking-wide uppercase"
        >
          {label}
        </label>
      )}

      <div className="relative rounded-lg shadow-xs">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`w-full rounded-lg bg-slate-50 border ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-slate-200 focus:border-blue-600 focus:ring-blue-500/20"
          } px-3.5 py-2.5 ${
            icon ? "pl-10" : ""
          } text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
