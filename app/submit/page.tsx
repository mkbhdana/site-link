import { SubmitSiteForm } from "@/components/submit-site-form"

export default function SubmitPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-pretty text-2xl font-semibold">Submit a Site</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your site for inclusion. Submissions require admin approval.
        </p>
      </header>
      <div className="rounded-lg border bg-card p-4">
        <SubmitSiteForm />
      </div>
    </main>
  )
}
