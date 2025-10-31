import Button from "../../component/ui/Button";

export default function ButtonsGalleryPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Buttons</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium">Variants</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium">Sizes</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Icon button">
            <span>★</span>
          </Button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-medium">States</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      </section>
    </main>
  );
}


