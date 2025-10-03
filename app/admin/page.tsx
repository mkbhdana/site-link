import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/auth"
import { SitesTable } from "@/components/admin/sites-table"
import { LogoutButton } from "@/components/admin/logout-button"

export default function AdminPage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login")
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Approve and manage site links.</p>
        </div>
        <LogoutButton />
      </header>

      <SitesTable />
    </main>
  )
}
