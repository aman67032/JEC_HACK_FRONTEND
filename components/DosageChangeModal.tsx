"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  medName?: string;
};

export default function DosageChangeModal({ open, onClose, medName }: Props) {
  if (!open) return null;
  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const dosage = (form.elements.namedItem("dosage") as HTMLInputElement).value;
    const reason = (form.elements.namedItem("reason") as HTMLSelectElement).value;
    const event = new CustomEvent("dosageChange", { detail: { dosage, reason } });
    window.dispatchEvent(event);
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={handleSave} className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-1 text-lg font-semibold">Edit Dosage</h3>
        <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">{medName}</p>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm">New dosage</label>
            <input name="dosage" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900" placeholder="e.g., 750mg" />
          </div>
          <div className="grid gap-1">
            <label className="text-sm">Reason</label>
            <select name="reason" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <option>Doctor adjusted</option>
              <option>Side effects</option>
              <option>Out of stock switch</option>
              <option>Other</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">Cancel</button>
            <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black">Save</button>
          </div>
        </div>
      </form>
    </div>
  );
}

