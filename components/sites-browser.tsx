"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import { SiteCard } from "./site-card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Skeleton } from "./ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { SmartPagination } from "./page-nation";

type ApiPage = {
  items: Array<{
    _id: string;
    name: string;
    url: string;
    logoUrl?: string | null;
    lightLogoUrl?: string | null;
    darkLogoUrl?: string | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SitesBrowser() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"createdAt" | "name">("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);

  const qDebounced = useDebounce(q, 400);

  useEffect(() => {
    setPage(0);
  }, [qDebounced]);

  const params = useMemo(() => {
    const usp = new URLSearchParams();
    usp.set("paginated", "1");
    usp.set("page", String(page));
    usp.set("pageSize", String(pageSize));
    usp.set("sort", sort);
    usp.set("dir", dir);
    if (qDebounced.trim()) usp.set("q", qDebounced.trim());
    return usp.toString();
  }, [qDebounced, sort, dir, page, pageSize]);

  const { data, error, isLoading } = useSWR<ApiPage>(
    `/api/sites?${params}`,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  return (
    <section className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
        }}
        className="flex flex-col md:flex-row gap-2 items-center justify-between"
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or URL"
          className="w-75 h-9"
          aria-label="Search"
        />

        <div className="flex items-center gap-2">
          <Select
            value={`${sort}:${dir}`}
            onValueChange={(val) => {
              const [s, d] = val.split(":");
              setSort(s as any);
              setDir(d as any);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 grow">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc">Newest</SelectItem>
              <SelectItem value="createdAt:asc">Oldest</SelectItem>
              <SelectItem value="name:asc">Name A–Z</SelectItem>
              <SelectItem value="name:desc">Name Z–A</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-[96px]">
              <SelectValue placeholder="Page size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="28">28</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </form>

      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <Skeleton className="mb-2 h-8 w-full" />
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-sm text-destructive">Failed to load</div>}
      {data && data.items.length === 0 && !isLoading && (
        <div className="text-sm text-muted-foreground">No sites found.</div>
      )}

      {data && data.items.length > 0 && !isLoading && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((s) => (
              <SiteCard
                key={s._id}
                name={s.name}
                url={s.url}
                logoUrl={s.logoUrl}
                lightLogoUrl={s.lightLogoUrl}
                darkLogoUrl={s.darkLogoUrl}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <SmartPagination
              page={data.page}
              totalPages={totalPages}
              onPageChange={setPage}
              siblingCount={2}
            />
          </div>
        </>
      )}
    </section>
  );
}
