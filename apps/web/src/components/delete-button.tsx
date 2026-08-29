"use client";

import { type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function DeleteButton({
  action,
  children,
  title,
  description,
  successMessage,
  errorMessage,
  redirectTo,
}: {
  action: () => Promise<void>;
  children: ReactElement;
  title: string;
  description: string;
  successMessage: string;
  errorMessage: string;
  redirectTo?: string;
}) {
  const router = useRouter();

  return (
    <ConfirmDialog
      trigger={children}
      title={title}
      description={description}
      action={action}
      successMessage={successMessage}
      errorMessage={errorMessage}
      onSuccess={() => (redirectTo ? router.push(redirectTo) : router.refresh())}
    />
  );
}
