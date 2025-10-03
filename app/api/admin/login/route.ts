import { NextResponse } from "next/server"
import { setAdminSession, clearAdminSession } from "@/lib/auth"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { password, action } = body || {}

  if (action === "logout") {
    clearAdminSession()
    return NextResponse.json({ ok: true })
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 })
  }
  if (!password || password !== adminPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  setAdminSession()
  return NextResponse.json({ ok: true })
}
