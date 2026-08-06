import React from "react";
import { clsx } from "clsx";

export default function GlassInput({
  id,
  name,
  type = "text",
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  endElement,
  error,
  required = false,
  autoComplete,
  className = "",
  labelRightElement,
  disabled = false,
  ...props
}) {
  const inputId = id || name;

  return (
    <div className="w-full space-y-[8px]">
      {label && (
        <div className="flex items-baseline justify-between text-[15px] font-semibold text-[#111827]">
          <label htmlFor={inputId} className="cursor-pointer select-none">
            {label}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </label>
          {labelRightElement}
        </div>
      )}

      <div className="relative flex items-center group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1AA8A8] transition-colors pointer-events-none">
            <Icon size={20} />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={clsx(
            "w-full h-[60px] rounded-[16px] text-base font-medium transition-all duration-200 outline-none px-4",
            "bg-white border border-slate-200 text-[#111827] placeholder:text-slate-400/90 shadow-2xs",
            "focus:border-[#1AA8A8] focus:ring-4 focus:ring-[#1AA8A8]/10",
            Icon ? "pl-12" : "pl-4",
            endElement ? "pr-12" : "pr-4",
            error && "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/20",
            disabled && "opacity-60 cursor-not-allowed bg-slate-100",
            className
          )}
          {...props}
        />

        {endElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
            {endElement}
          </div>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-rose-500 flex items-center gap-1 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
