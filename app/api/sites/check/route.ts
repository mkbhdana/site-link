import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";
import { ObjectId } from "mongodb";

async function checkUrl(url: string, timeoutMs = 30000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/118.0.5993.70 Safari/537.36",
      },
      signal: controller.signal,
    });
    clearTimeout(t);
    const ok = res.ok || (res.status >= 200 && res.status < 405);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  const ids = idsParam
    ? idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const filter =
    ids.length > 0
      ? {
          _id: {
            $in: ids
              .filter((id) => ObjectId.isValid(id))
              .map((id) => new ObjectId(id)),
          },
        }
      : {};

  const cursor = db
    .collection("sites")
    .find(filter)
    .project({ _id: 1, url: 1 });
  const sites = await cursor.toArray();

  const nowIso = new Date().toISOString();
  let updated = 0;

  await Promise.all(
    sites.map(async (s: any) => {
      const ok = await checkUrl(s.url);
      const live = ok ? "up" : "down";
      await db
        .collection("sites")
        .updateOne(
          { _id: s._id },
          { $set: { live, lastChecked: nowIso, updatedAt: nowIso } }
        );
      updated++;
    })
  );

  return NextResponse.json({ checked: sites.length, updated });
}
