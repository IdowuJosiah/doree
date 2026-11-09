"use client";

import { useFormStatus } from "react-dom";

export function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Deleting… this can take a minute" : label}
    </button>
  );
}
