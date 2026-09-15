export function ScoreBar({ percent, gradient }: { percent: string; gradient?: string }) {
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E8EDF8]">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: percent,
          background: gradient ?? "linear-gradient(90deg,#5DD3B4,#2B5BE2)",
        }}
      />
    </div>
  );
}
