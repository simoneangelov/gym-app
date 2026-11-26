"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText,
  confirmText,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string; confirmText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      {...rest}
      className={className}
      disabled={pending || rest.disabled}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
        rest.onClick?.(e);
      }}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
