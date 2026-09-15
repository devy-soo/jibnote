export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-5 my-6 rounded-3xl border border-dashed border-ink/20 bg-white/60 px-5 py-9 text-center">
      <p className="mb-1 text-sm font-bold text-ink">{title}</p>
      <p className="text-[12.5px] font-medium text-ink-faint">{description}</p>
    </div>
  );
}
