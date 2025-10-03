import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const updates: any = {};
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.url === "string") updates.url = body.url;
  if (typeof body.logoUrl === "string" || body.logoUrl === null)
    updates.logoUrl = body.logoUrl;
  if (typeof body.lightLogoUrl === "string" || body.lightLogoUrl === null)
    updates.lightLogoUrl = body.lightLogoUrl;
  if (typeof body.darkLogoUrl === "string" || body.darkLogoUrl === null)
    updates.darkLogoUrl = body.darkLogoUrl;
  if (body.status === "approved" || body.status === "pending")
    updates.status = body.status;
  if (body.live === "up" || body.live === "down") updates.live = body.live;
  if (typeof body.lastChecked === "string" || body.lastChecked === null)
    updates.lastChecked = body.lastChecked;
  updates.updatedAt = new Date().toISOString();

  const db = await getDb();
  const {id} = await params;
  if (!ObjectId.isValid(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await db
    .collection("sites")
    .updateOne({ _id: new ObjectId(id) }, { $set: updates });
  const doc = await db.collection("sites").findOne({ _id: new ObjectId(id) });
  return NextResponse.json({ _id: id, ...doc, _idStr: undefined });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await getDb();
  const {id} = await params;
  if (!ObjectId.isValid(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  await db.collection("sites").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ ok: true });
}
