export function ProgressBar({ label }: { label: string }) {
  return (
    <div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E8EDF8]">
        <div className="h-full w-1/3 animate-progress-indeterminate rounded-full bg-primary" />
      </div>
      <p className="mt-1.5 text-[11.5px] font-semibold text-primary-dark">{label}</p>
    </div>
  );
}
