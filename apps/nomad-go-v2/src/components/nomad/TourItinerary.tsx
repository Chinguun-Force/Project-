type JourneyStep = {
  id?: string;
  title?: string;
  description?: string;
  time_slot?: string;
  time?: string;
  xp_reward?: number;
  step_order?: number;
};

type JourneyDay = {
  id?: string;
  day_number?: number;
  title?: string;
  description?: string;
  journey_steps?: JourneyStep[];
};

function sortSteps(steps: JourneyStep[]) {
  return [...steps].sort(
    (a, b) => (a.step_order ?? 0) - (b.step_order ?? 0)
  );
}

export default function TourItinerary({
  days,
  locked = false,
}: {
  days: JourneyDay[];
  locked?: boolean;
}) {
  const sortedDays = [...(days || [])].sort(
    (a, b) => (a.day_number || 0) - (b.day_number || 0)
  );

  if (sortedDays.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 italic">
        Itinerary is being prepared for this tour.
      </p>
    );
  }

  return (
    <div className={`space-y-8 ${locked ? "opacity-60" : ""}`}>
      {sortedDays.map((day, idx) => {
        const steps = sortSteps(day.journey_steps || []);
        return (
          <div
            key={day.id || idx}
            className="relative pl-8 border-l-2 border-border pb-4 last:border-l-0"
          >
            <div className="absolute w-4 h-4 rounded-full bg-foreground left-[-9px] top-1" />
            <h3 className="text-xl font-bold text-foreground">
              Day {day.day_number || idx + 1}
              {day.title ? `: ${day.title}` : ""}
            </h3>
            {day.description && (
              <p className="text-muted-foreground mt-2 mb-4">{day.description}</p>
            )}

            {steps.length > 0 ? (
              <div className="mt-4 space-y-3">
                {steps.map((step, stepIdx) => (
                  <div
                    key={step.id || stepIdx}
                    className="p-4 rounded-xl bg-muted/50 border border-border"
                  >
                    {(step.time_slot || step.time) && (
                      <span className="font-mono text-sm font-bold text-emerald-400 block mb-1">
                        {step.time_slot || step.time}
                      </span>
                    )}
                    <div className="font-medium text-foreground">
                      {step.title || `Activity ${stepIdx + 1}`}
                    </div>
                    {step.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    )}
                    {(step.xp_reward ?? 0) > 0 && (
                      <div className="text-xs font-bold text-emerald-400 mt-2">
                        +{step.xp_reward} XP
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-2 italic">
                No steps scheduled for this day yet.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
