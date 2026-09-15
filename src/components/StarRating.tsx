interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  const readOnly = !onChange;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n === value ? 0 : n)}
            className={readOnly ? "cursor-default" : "cursor-pointer"}
            aria-label={`${n}점`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill={filled ? "#F2A33C" : "none"}
              stroke={filled ? "#F2A33C" : "#C7D0E0"}
              strokeWidth="1.6"
              strokeLinejoin="round"
            >
              <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
