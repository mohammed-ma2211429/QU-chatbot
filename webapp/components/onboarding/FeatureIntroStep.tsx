"use client";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: "01",
    title: "Tell me what you’ve finished",
    description: "Choose completed courses from your program’s course map.",
  },
  {
    icon: "02",
    title: "Share what matters to you",
    description: "Work hours, days off, workload, and graduation plans all count.",
  },
  {
    icon: "03",
    title: "Adjust it until it feels right",
    description: "You’ll get a full plan, the reasoning behind it, and room to change things.",
  },
];

interface FeatureIntroStepProps {
  onNext: () => void;
}

export function FeatureIntroStep({ onNext }: FeatureIntroStepProps) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-qu-maroon">It only takes a few minutes</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-qu-ink">Here&apos;s how this works.</h2>
      <p className="mt-2 text-sm leading-6 text-qu-muted">We&apos;ll start with your degree, then shape the plan around the way you actually study and live.</p>

      <div className="mt-6 space-y-5">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex gap-4 rounded-2xl border border-qu-rose-border/80 bg-white p-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-qu-rose text-[10px] font-bold tracking-wider text-qu-maroon">
              {f.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-qu-ink">{f.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-qu-muted">{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="mt-7 w-full rounded-xl bg-qu-maroon px-4 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-qu-maroon-dark"
      >
        Sounds good
      </button>

      <p className="mt-4 text-center text-[10px] leading-4 text-qu-muted">
        This is a beta tool and can make mistakes. Always verify your schedule with your academic
        advisor before registering.
      </p>
    </div>
  );
}
