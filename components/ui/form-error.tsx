import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string | null;
}

/**
 * Inline form error component for displaying validation errors
 * below form fields with consistent styling.
 */
const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  ({ className, message, ...props }, ref) => {
    if (!message) return null;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex items-center gap-1.5 text-sm text-destructive mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200",
          className
        )}
        {...props}
      >
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  }
);
FormError.displayName = "FormError";

export { FormError };
