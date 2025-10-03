import { Suspense } from "react";
import { SitesBrowser } from "@/components/sites-browser";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-pretty text-2xl font-semibold">Discover Sites</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse approved sites with search and filters.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">Loading...</div>
        }
      >
        <SitesBrowser />
      </Suspense>
    </main>
  );
}
