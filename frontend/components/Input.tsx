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
          className="block text-xs font-medium text-zinc-300 tracking-wide uppercase"
        >
          {label}
        </label>
      )}

      <div className="relative rounded-lg shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={`w-full rounded-lg bg-zinc-900/90 border ${
            error
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
              : "border-zinc-800 focus:border-orange-500 focus:ring-orange-500/20"
          } px-3.5 py-2.5 ${
            icon ? "pl-10" : ""
          } text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 disabled:bg-zinc-900/40 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-400 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-zinc-400 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
