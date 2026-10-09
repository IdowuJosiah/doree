import type { ReactNode } from "react";

export function Notice({ searchParams }: { searchParams: { error?: string; saved?: string; published?: string; unpublished?: string } }) {
  if (searchParams.error) {
    return <p role="alert" className="mb-6 border border-red-800 px-4 py-3 text-sm text-red-800">{searchParams.error}</p>;
  }
  if (searchParams.published) {
    return <p role="status" className="mb-6 border border-gold bg-gold px-4 py-3 text-sm text-ink">Published. It is now live on the shop (allow up to a minute).</p>;
  }
  if (searchParams.unpublished) {
    return <p role="status" className="mb-6 border border-gold px-4 py-3 text-sm text-gold-text">Unpublished. It is no longer visible on the shop.</p>;
  }
  if (searchParams.saved) {
    return <p role="status" className="mb-6 border border-gold px-4 py-3 text-sm text-gold-text">Saved.</p>;
  }
  return null;
}

export function Card({ title, children, hint }: { title: string; children: ReactNode; hint?: string }) {
  return (
    <section className="mb-10 border border-line p-6">
      <h2 className="font-display text-2xl">{title}</h2>
      {hint && <p className="mt-1 text-sm opacity-70">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  hint,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  hint?: string;
  step?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="label mb-1 block">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} required={required} step={step} className="field !h-10" />
      {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, name, defaultValue, rows = 4 }: { label: string; name: string; defaultValue?: string; rows?: number }) {
  return (
    <div>
      <label htmlFor={name} className="label mb-1 block">{label}</label>
      <textarea id={name} name={name} rows={rows} defaultValue={defaultValue} className="field !h-auto py-2" />
    </div>
  );
}

export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-[44px] items-center gap-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[var(--gold-text)]" />
      {label}
    </label>
  );
}

export const Save = ({ children = "Save" }: { children?: ReactNode }) => <button type="submit" className="btn-primary">{children}</button>;
export const Small = ({ children, danger }: { children: ReactNode; danger?: boolean }) => (
  <button type="submit" className={`btn-outline !min-h-[36px] !px-4 !py-1.5 ${danger ? "!border-red-800 !text-red-800 hover:!bg-red-800 hover:!text-cream" : ""}`}>
    {children}
  </button>
);
