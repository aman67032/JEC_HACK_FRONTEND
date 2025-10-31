const features = [
  {
    title: "Scroll Observer",
    points: [
      "Synchronise and trigger animations on scroll",
      "Multiple synchronisation modes",
      "Advanced thresholds",
      "Complete set of callbacks",
    ],
  },
  {
    title: "Advanced Staggering",
    points: [
      "Time staggering",
      "Values staggering",
      "Timeline positions staggering",
    ],
  },
  {
    title: "SVG Toolset",
    points: ["Shape morphing", "Line drawing", "Motion path"],
  },
  {
    title: "Springs & Draggable",
    points: [
      "Drag, snap, flick and throw elements",
      "Versatile settings",
      "Comprehensive callbacks",
      "Useful methods",
    ],
  },
  {
    title: "Runs like clockwork",
    points: [
      "Orchestrate animation sequences",
      "Advanced time positions",
      "Playback settings",
    ],
  },
  {
    title: "Responsive animations",
    points: [
      "Make animations respond to media queries",
      "Custom root element",
      "Scoped methods",
    ],
  },
  {
    title: "Lightweight & modular",
    points: ["Import only what you need", "Keep bundle size small"],
  },
  {
    title: "Docs",
    points: [
      "Getting started",
      "Animation & Timeline",
      "Draggable & Scroll",
      "SVG & Utils",
    ],
  },
];

export default function FeaturesSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24">
      <h2 className="mb-10 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Features</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800"
          >
            <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {f.title}
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
              {f.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}


