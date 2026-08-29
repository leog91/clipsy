"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useId, useState, type MouseEvent, type ReactElement, type ReactNode } from "react";
import { toast } from "sonner";

interface ConfirmDialogProps {
  trigger: ReactElement;
  title: string;
  description: ReactNode;
  action: () => Promise<void>;
  confirmLabel?: string;
  pendingLabel?: string;
  successMessage: string;
  errorMessage: string;
  confirmationPhrase?: string;
  onSuccess?: () => void;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  action,
  confirmLabel = "Delete",
  pendingLabel = "Deleting...",
  successMessage,
  errorMessage,
  confirmationPhrase,
  onSuccess,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirmationValue, setConfirmationValue] = useState("");
  const confirmationInputId = useId();
  const confirmed = !confirmationPhrase || confirmationValue === confirmationPhrase;

  const handleOpenChange = (nextOpen: boolean) => {
    if (pending) return;
    setOpen(nextOpen);
    if (!nextOpen) setConfirmationValue("");
  };

  const handleConfirm = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!confirmed || pending) return;

    setPending(true);
    try {
      await action();
      toast.success(successMessage);
      setOpen(false);
      setConfirmationValue("");
      onSuccess?.();
    } catch {
      toast.error(errorMessage);
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-2xl focus:outline-none sm:p-6">
          <AlertDialog.Title className="text-lg font-semibold text-gray-100">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mt-2 text-sm leading-6 text-gray-400">{description}</div>
          </AlertDialog.Description>

          {confirmationPhrase && (
            <div className="mt-4">
              <label htmlFor={confirmationInputId} className="mb-2 block text-sm text-gray-400">
                Type <strong className="text-gray-200">{confirmationPhrase}</strong> to confirm:
              </label>
              <input
                id={confirmationInputId}
                value={confirmationValue}
                onChange={(event) => setConfirmationValue(event.target.value)}
                disabled={pending}
                autoComplete="off"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-gray-100 placeholder-gray-500 focus:border-red-500 focus:outline-none disabled:opacity-50"
                placeholder={`Type ${confirmationPhrase}`}
              />
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                disabled={pending}
                className="w-full rounded-lg px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!confirmed || pending}
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {pending ? pendingLabel : confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
