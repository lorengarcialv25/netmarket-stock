"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ── FormInput: Input with label + optional icon ── */
interface FormInputProps extends React.ComponentProps<"input"> {
  label?: string;
  icon?: React.ReactNode;
}

export function FormInput({ label, icon, className, ...props }: FormInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </div>
        )}
        <Input
          className={cn("h-9", icon && "pl-9", className)}
          {...props}
        />
      </div>
    </div>
  );
}

/* ── FormSelect: styled select using Base UI ── */

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  options?: SelectOption[];
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
  /** Clases para el &lt;label&gt; (p. ej. toolbar compacto). */
  labelClassName?: string;
  /** Clases para el trigger del Select (altura, texto). */
  triggerClassName?: string;
  disabled?: boolean;
}

function extractOptions(children: React.ReactNode): SelectOption[] {
  const opts: SelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<{ value?: string; children?: React.ReactNode }>(child) && child.type === "option") {
      opts.push({
        value: String(child.props.value ?? ""),
        label: typeof child.props.children === "string" ? child.props.children : String(child.props.children ?? ""),
      });
    }
  });
  return opts;
}

const EMPTY_SENTINEL = "__all__";

export function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  children,
  className,
  labelClassName,
  triggerClassName,
  disabled,
}: FormSelectProps) {
  const resolvedOptions = options ?? extractOptions(children);

  // Radix SelectItem doesn't support value="", so map empty values to a sentinel
  const hasEmptyOption = resolvedOptions.some((opt) => opt.value === "");
  const mappedOptions = resolvedOptions.map((opt) => ({
    ...opt,
    value: opt.value === "" ? EMPTY_SENTINEL : opt.value,
  }));

  // If current value is empty and there's an option for "", use sentinel
  // If current value is empty and no option for "", leave undefined (shows placeholder)
  let selectValue: string | undefined;
  if (!value) {
    selectValue = hasEmptyOption ? EMPTY_SENTINEL : undefined;
  } else {
    selectValue = value;
  }

  const handleChange = (newValue: string) => {
    const real = newValue === EMPTY_SENTINEL ? "" : newValue;
    onChange?.({ target: { value: real } });
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          className={cn(
            "text-sm font-medium text-foreground",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      <Select value={selectValue} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className={cn("w-full", triggerClassName)}>
          <SelectValue placeholder={placeholder ?? "Seleccionar..."} />
        </SelectTrigger>
        <SelectContent>
          {mappedOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ── FormTextarea: Textarea with label ── */
interface FormTextareaProps extends React.ComponentProps<"textarea"> {
  label?: string;
}

export function FormTextarea({ label, className, ...props }: FormTextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <Textarea className={cn("min-h-[80px]", className)} {...props} />
    </div>
  );
}
