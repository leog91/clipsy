"use client";

import { type ReactNode } from "react";

export function DeleteButton({
  action,
  children,
  message,
}: {
  action: (formData: FormData) => Promise<void>;
  children: ReactNode;
  message: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
