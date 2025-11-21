import * as React from "react";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Input } from "./input";
import { Label } from "./label";
import { cn } from "@/utils/cn";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showRequirements?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const defaultRequirements: PasswordRequirement[] = [
  {
    label: "At least 12 characters",
    test: (pwd) => pwd.length >= 12,
  },
  {
    label: "Contains uppercase letter",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: "Contains lowercase letter",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: "Contains number",
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    label: "Contains symbol",
    test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  },
];

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      label,
      showRequirements = false,
      value,
      onChange,
      onBlur,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const requirements = showRequirements ? defaultRequirements : [];

    const getRequirementStatus = (requirement: PasswordRequirement) => {
      if (!value) return "pending";
      return requirement.test(value) ? "met" : "not-met";
    };

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={id} className="block text-sm font-medium text-text-primary">
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            id={id}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className={cn("pr-10", className)}
            ref={ref}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {showRequirements && (isFocused || value) && (
          <div className="space-y-1.5 pt-1">
            {requirements.map((requirement, index) => {
              const status = getRequirementStatus(requirement);
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      status === "met"
                        ? "text-green-500 dark:text-green-400"
                        : status === "not-met"
                        ? "text-text-muted"
                        : "text-text-muted"
                    )}
                  >
                    {status === "met" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-current" />
                    )}
                  </div>
                  <span
                    className={cn(
                      status === "met"
                        ? "text-green-600 dark:text-green-400"
                        : "text-text-secondary"
                    )}
                  >
                    {requirement.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };

