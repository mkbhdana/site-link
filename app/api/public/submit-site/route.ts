import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { name, url, logoUrl, lightLogoUrl, darkLogoUrl, categories, tags } = body || {}
  if (!name || !url) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const toArray = (v: unknown) => {
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean)
    if (typeof v === "string")
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    return []
  }

  const now = new Date().toISOString()
  const db = await getDb()
  const doc = {
    name,
    url,
    logoUrl: logoUrl || null,
    lightLogoUrl: lightLogoUrl || null,
    darkLogoUrl: darkLogoUrl || null,
    categories: toArray(categories),
    tags: toArray(tags),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  }
  const res = await db.collection("sites").insertOne(doc)
  return NextResponse.json({ _id: String(res.insertedId), ...doc })
}
