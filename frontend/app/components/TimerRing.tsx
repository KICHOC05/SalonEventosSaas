interface TimerRingProps {
    percentage: number;
    minutesRemaining: number;
    status: "RUNNING" | "EXPIRING" | "FINISHED";
}

export default function TimerRing({
    percentage,
    minutesRemaining,
    status,
}: TimerRingProps) {

    const normalizedPercentage = Math.max(
        0,
        Math.min(100, percentage)
    );

    const radius = 50;
    const stroke = 12;

    const circumference =
        2 * Math.PI * radius;

    const offset =
        circumference -
        (normalizedPercentage / 100) *
        circumference;

    const color =
        status === "FINISHED"
            ? "#6b7280"
            : status === "EXPIRING"
                ? "#f59e0b"
                : "#10b981";

    const glow =
        status === "FINISHED"
            ? "drop-shadow(0 0 4px rgba(107,114,128,.5))"
            : status === "EXPIRING"
                ? "drop-shadow(0 0 10px rgba(245,158,11,.8))"
                : "drop-shadow(0 0 10px rgba(16,185,129,.8))";

    return (
        <div className="relative w-40 h-40">

            <svg
                className="w-40 h-40 -rotate-90"
                viewBox="0 0 140 140"
            >
                <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,.08)"
                    strokeWidth={stroke}
                />

                <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition:
                            "stroke-dashoffset 1s linear, stroke .3s ease",
                        filter: glow,
                    }}
                />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">

                <span
                    className={`
                        text-4xl
                        font-extrabold
                        tabular-nums
                        ${
                            status === "EXPIRING"
                                ? "animate-pulse"
                                : ""
                        }
                    `}
                >
                    {minutesRemaining}
                </span>

                <span className="text-xs uppercase tracking-wider text-base-content/50">
                    min
                </span>

                <span
                    className={`
                        mt-1
                        text-[10px]
                        font-bold
                        ${
                            status === "RUNNING"
                                ? "text-success"
                                : status === "EXPIRING"
                                ? "text-warning"
                                : "text-base-content/40"
                        }
                    `}
                >
                    {Math.round(normalizedPercentage)}%
                </span>

            </div>
        </div>
    );
}