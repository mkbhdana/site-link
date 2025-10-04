import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status"); // "approved" | "pending" | "all"
  const q = (searchParams.get("q") || "").trim();

  const sort = (searchParams.get("sort") || "createdAt") as
    | "createdAt"
    | "name";
  const dir = (searchParams.get("dir") || "desc") as "asc" | "desc";
  const page = Number(searchParams.get("page") || "0");
  const pageSize = Math.min(
    60,
    Math.max(1, Number(searchParams.get("pageSize") || "12"))
  );
  const paginated =
    searchParams.get("paginated") === "1" || searchParams.has("page");

  const db = await getDb();

  const query: any = {};
  if (statusParam && statusParam !== "all") {
    query.status = statusParam;
  }
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: rx }, { url: rx }];
  }

  const sortSpec: Record<string, 1 | -1> =
    sort === "name"
      ? { name: dir === "asc" ? 1 : -1 }
      : { createdAt: dir === "asc" ? 1 : -1 };

  if (paginated) {
    const total = await db.collection("sites").countDocuments(query);
    const docs = await db
      .collection("sites")
      .find(query)
      .sort(sortSpec)
      .skip(page * pageSize)
      .limit(pageSize)
      .toArray();

    return NextResponse.json({
      items: docs.map((d: any) => ({
        _id: String(d._id),
        name: d.name,
        url: d.url,
        logoUrl: d.logoUrl || null,
        lightLogoUrl: d.lightLogoUrl || null,
        darkLogoUrl: d.darkLogoUrl || null,
        status: d.status,
        live:
          typeof d.live === "string"
            ? d.live
            : typeof d.live === "boolean"
            ? d.live
              ? "up"
              : "down"
            : undefined,
        lastChecked: d.lastChecked || null,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      total,
      page,
      pageSize,
    });
  }

  const docs = await db
    .collection("sites")
    .find(query)
    .sort(sortSpec)
    .toArray();
  return NextResponse.json(
    docs.map((d: any) => ({
      _id: String(d._id),
      name: d.name,
      url: d.url,
      logoUrl: d.logoUrl || null,
      lightLogoUrl: d.lightLogoUrl || null,
      darkLogoUrl: d.darkLogoUrl || null,
      status: d.status,
      live:
        typeof d.live === "string"
          ? d.live
          : typeof d.live === "boolean"
          ? d.live
            ? "up"
            : "down"
          : undefined,
      lastChecked: d.lastChecked || null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { name, url, logoUrl, lightLogoUrl, darkLogoUrl, status, live } =
    body || {};
  if (!name || !url)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const toArray = (v: unknown) => {
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    if (typeof v === "string")
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return [];
  };

  const now = new Date().toISOString();
  const db = await getDb();
  const normalizedStatus =
    status === "approved"
      ? "approved"
      : status === "pending"
      ? "pending"
      : "pending";
  const normalizedLive: "up" | "down" =
    live === "up" || live === "down"
      ? live
      : normalizedStatus === "approved"
      ? "up"
      : "down";

  const doc = {
    name,
    url,
    logoUrl: logoUrl || null,
    lightLogoUrl: lightLogoUrl || null,
    darkLogoUrl: darkLogoUrl || null,
    status: normalizedStatus,
    live: normalizedLive,
    lastChecked: null,
    createdAt: now,
    updatedAt: now,
  };
  const res = await db.collection("sites").insertOne(doc);
  return NextResponse.json({ _id: String(res.insertedId), ...doc });
}
