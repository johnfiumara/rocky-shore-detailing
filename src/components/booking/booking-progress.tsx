const STEP_LABELS = ["Vehicle", "When & Where", "Photos & Contact"];

export default function BookingProgress({ step }: { step: 0 | 1 | 2 }) {
  return (
    <ol
      aria-label="Booking progress"
      className="flex items-center gap-6 mb-12 font-mono-accent text-[11px] tracking-[0.2em] uppercase"
    >
      {STEP_LABELS.map((label, i) => {
        const isCurrent = i === step;
        const isDone = i < step;
        return (
          <li
            key={label}
            aria-current={isCurrent ? "step" : undefined}
            className={`flex items-center gap-3 ${
              isCurrent ? "text-bronze" : isDone ? "text-bone-dim" : "text-mist"
            }`}
          >
            <span
              className={`size-6 rounded-full border flex items-center justify-center text-[10px] ${
                isCurrent
                  ? "border-bronze bg-bronze/15 text-bronze"
                  : isDone
                    ? "border-bone-dim text-bone-dim"
                    : "border-line text-mist"
              }`}
            >
              {i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
