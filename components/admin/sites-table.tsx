"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";

import useSWR from "swr";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Site } from "@/types/site";
import { SmartPagination } from "../page-nation";
import { EditForm } from "./edit-form";
import { toast } from "sonner";

type ApiPage = {
  items: Site[];
  total: number;
  page: number;
  pageSize: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function SitesTable() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "approved" | "pending"
  >("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<"createdAt" | "name">("createdAt");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const { data, error, isLoading, mutate } = useSWR<ApiPage>(
    `/api/sites?includePending=1&status=${statusFilter}&paginated=1&sort=${sort}&dir=${dir}&page=${page}&pageSize=${pageSize}`,
    fetcher
  );
  const [editing, setEditing] = useState<Site | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [checking, setChecking] = useState(false);

  const tableRef = useRef<HTMLTableElement>(null);
  const headerRef = useRef<HTMLTableHeaderCellElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [rowHeight, setRowHeight] = useState<number>(0);
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const theadRef = useRef<HTMLTableSectionElement | null>(null);
  const firstRowRef = useRef<HTMLTableRowElement | null>(null);
  const [maxTableHeight, setMaxTableHeight] = useState<number | null>(null);

  // local pending state for dialogs
  const [approveOpen, setApproveOpen] = useState(false);
  const [approvePending, setApprovePending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  useEffect(() => {
    function computeMaxHeight() {
      const headerH = theadRef.current?.getBoundingClientRect().height || 0;
      const rowH = firstRowRef.current?.getBoundingClientRect().height || 0;
      if (rowH > 0) {
        // header + 10 rows; add 1px for border seam
        setMaxTableHeight(Math.ceil(headerH + rowH * 10 + 1));
      }
    }
    computeMaxHeight();
    window.addEventListener("resize", computeMaxHeight);
    return () => window.removeEventListener("resize", computeMaxHeight);
  }, [data?.items?.length]);

  useEffect(() => {
    if (tableRef.current && headerRef.current) {
      setHeaderHeight(headerRef.current.clientHeight);
      setRowHeight(tableRef.current.rows[0]?.clientHeight || 0);
    }
  }, [data]);

  const allIds = (data?.items || []).map((s) => s._id!).filter(Boolean);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected[id]);

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);
  const selectedPending = useMemo(() => {
    const map = new Map((data?.items || []).map((s) => [s._id!, s.status]));
    return selectedIds.filter((id) => map.get(id) === "pending");
  }, [data?.items, selectedIds]);

  const hasSelected =
    Object.keys(selected).length > 0 &&
    Object.values(selected).some((v) => v === true);

  function toggleAll() {
    const next: Record<string, boolean> = {};
    setSelected(next);
  }

  function toggleOne(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function approve(id: string) {
    await fetch(`/api/sites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    mutate();
  }

  async function remove(id: string) {
    if (!id) return;
    await fetch(`/api/sites/${id}`, { method: "DELETE" });
  }

  async function approveSelected() {
    try {
      setApprovePending(true);
      await Promise.all(
        selectedPending.map((id) =>
          fetch(`/api/sites/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "approved" }),
          })
        )
      );
      setSelected({});
      await mutate();
      toast.success("Selected Sites has been successfully deleted.");
    } catch {
      toast.error("Approval failed");
    } finally {
      setApprovePending(false);
      setApproveOpen(false);
    }
  }

  async function globalCheck(ids?: string[]) {
    try {
      setChecking(true);
      const qs =
        ids && ids.length ? `?ids=${encodeURIComponent(ids.join(","))}` : "";
      const res = await fetch(`/api/sites/check${qs}`, { method: "POST" });
      if (!res.ok) throw new Error("Global check failed");
      await mutate();
    } finally {
      setChecking(false);
    }
  }

  async function deleteSelected() {
    const ids = Object.keys(selected).filter((k) => selected[k]);
    if (ids.length === 0) return;
    await Promise.all(ids.map((id) => remove(id)));
    setSelected({});
    mutate();
    toast.success("Selected Sites has been successfully deleted.");
  }

  function exportCsv() {
    setSelected({});
    const rows = [
      [
        "_id",
        "name",
        "url",
        "status",
        "up",
        "lastChecked",
        "categories",
        "tags",
        "createdAt",
        "updatedAt",
      ],
      ...(data?.items || []).map((s) => [
        s._id || "",
        s.name || "",
        s.url || "",
        s.status || "",
        String((s as any).live ?? s.live === "up"),
        (s as any).lastChecked || "",
        (s as any).categories?.join("|") || "",
        (s as any).tags?.join("|") || "",
        s.createdAt || "",
        s.updatedAt || "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sites.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-full">
            <TableHeader className="bg-accent">
              <TableRow>
                {Array.from({ length: 7 }).map((_, i) => (
                  <TableHead key={i} className="px-3 py-2">
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 7 }).map((_, r) => (
                <TableRow key={r} className="border-t">
                  {Array.from({ length: 5 }).map((__, c) => (
                    <TableCell key={c} className="px-3 py-3">
                      <Skeleton className="h-4 w-[70%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }
  if (error)
    return <div className="text-sm text-destructive">Failed to load</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-medium whitespace-nowrap">
            Manage Sites
          </h2>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as any);
              setSelected({});
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 overflow-x-auto sm:justify-end">
          {hasSelected && (
            <Button
              variant="default"
              className="h-9 bg-green-600 hover:bg-green-700 whitespace-nowrap"
              onClick={() => {
                if (selectedPending.length === 0) {
                  toast.error("No pending rows in selection");
                  return;
                }
                setApproveOpen(true);
              }}
            >
              Approve
            </Button>
          )}

          <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve Confirmation</AlertDialogTitle>
                <AlertDialogDescription>
                  Do you want to approve selected sites?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={approvePending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={approvePending}
                  onClick={approveSelected}
                >
                  {approvePending ? "Approving..." : "Confirm"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {hasSelected && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="h-9 whitespace-nowrap">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Do you want to delete selected sites?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deletePending}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    disabled={deletePending}
                    onClick={async () => {
                      try {
                        setDeletePending(true);
                        await deleteSelected();
                      } finally {
                        setDeletePending(false);
                      }
                    }}
                  >
                    {deletePending ? "Deleting..." : "Confirm"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Select
            value={`${sort}:${dir}`}
            onValueChange={(v) => {
              const [s, d] = v.split(":") as [
                "createdAt" | "name",
                "asc" | "desc"
              ];
              setSort(s);
              setDir(d);
              setPage(0);
              setSelected({});
            }}
          >
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt:desc">Created (newest)</SelectItem>
              <SelectItem value="createdAt:asc">Created (oldest)</SelectItem>
              <SelectItem value="name:asc">Name (A–Z)</SelectItem>
              <SelectItem value="name:desc">Name (Z–A)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(0);
              setSelected({});
            }}
          >
            <SelectTrigger className="h-9 w-[80px]">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => globalCheck()}
            variant="outline"
            className="h-9 bg-transparent whitespace-nowrap"
            disabled={checking}
          >
            {checking ? "Checking..." : "Global Check"}
          </Button>

          <Button
            onClick={exportCsv}
            variant="outline"
            className="h-9 bg-transparent whitespace-nowrap"
          >
            Export CSV
          </Button>

          <Button
            onClick={() => setCreating(true)}
            className="h-9 whitespace-nowrap"
          >
            Add Site
          </Button>
        </div>
      </div>

      <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DialogContent>
          <EditForm
            type="Add"
            onClose={() => {
              setCreating(false);
              mutate();
            }}
          />
        </DialogContent>
      </Dialog>

      <div
        className="rounded-lg border"
        ref={tableWrapperRef}
        style={{
          maxHeight:
            data && data.items.length > 10
              ? maxTableHeight ?? undefined
              : undefined,
          overflowY: data && data.items.length > 10 ? "auto" : "visible",
        }}
      >
        <Table className="min-w-full text-sm" ref={tableRef}>
          <TableHeader
            className="sticky top-0 z-10 bg-accent text-accent-foreground"
            ref={theadRef}
          >
            <TableRow>
              <TableHead className="px-3 py-2">
                <Checkbox
                  aria-label="Select all"
                  className="cursor-pointer"
                  checked={allSelected}
                  onCheckedChange={(v) => {
                    const checked = Boolean(v);
                    if (checked) {
                      const next: Record<string, boolean> = {};
                      allIds.forEach((id) => (next[id] = true));
                      setSelected(next);
                    } else {
                      setSelected({});
                    }
                  }}
                />
              </TableHead>
              <TableHead className="px-3 py-2">Name</TableHead>
              <TableHead className="px-3 py-2 md:table-cell">URL</TableHead>
              <TableHead className="px-3 py-2">Status</TableHead>
              <TableHead className="px-3 py-2">Live</TableHead>
              <TableHead className="px-3 py-2 sm:table-cell">
                Last Checked
              </TableHead>
              <TableHead className="px-3 py-2">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.items || []).map((s, i) => (
              <TableRow
                key={s._id}
                className="border-t"
                ref={i === 0 ? firstRowRef : undefined}
              >
                <TableCell className="px-3 py-2">
                  <Checkbox
                    aria-label={`Select ${s.name}`}
                    checked={!!selected[s._id!]}
                    onCheckedChange={() => toggleOne(s._id!)}
                    className="cursor-pointer"
                  />
                </TableCell>
                <TableCell className="px-3 py-2">
                  <div className="max-w-[220px] truncate md:max-w-none md:truncate-0">
                    {s.name}
                  </div>
                </TableCell>
                <TableCell className="px-3 py-2 md:table-cell">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline break-all"
                  >
                    {s.url}
                  </a>
                </TableCell>
                <TableCell className="px-3 py-2">
                  {s.status === "approved" ? (
                    <Badge className="badge-approved">Approved</Badge>
                  ) : (
                    <Badge className="badge-pending">Pending</Badge>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2">
                  {s.status === "pending" ? (
                    <Select
                      value={((s as any).live as "up" | "down") || "up"}
                      onValueChange={async (v) => {
                        await fetch(`/api/sites/${s._id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ live: v }),
                        }).then((r) => {
                          if (!r.ok)
                            throw new Error("Failed to update live status");
                        });
                        mutate();
                      }}
                    >
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue placeholder="Live" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="up">Up</SelectItem>
                        <SelectItem value="down">Down</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : s && (s as any).live === "up" ? (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="size-4" aria-hidden />
                      <span className="sr-only">Up</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <XCircle className="size-4" aria-hidden />
                      <span className="sr-only">Down</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2 sm:table-cell">
                  <span className="tabular-nums text-muted-foreground">
                    {(s as any).lastChecked
                      ? new Date((s as any).lastChecked).toLocaleString()
                      : "—"}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => setEditing(s)}
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${s.name}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${s.name}`}
                          className="text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete “{s.name}”?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the site and its data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={async () => {
                              await remove(s._id!);
                              mutate();
                              toast.success(
                                "Site has been successfully deleted."
                              );
                            }}
                          >
                            Confirm
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {s.status === "pending" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Approve “{s.name}”?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will mark this site as approved.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                await approve(s._id!);
                                toast.success(
                                  "Site has been successfully approved."
                                );
                              }}
                            >
                              Confirm
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!data || data.items.length === 0) && (
              <TableRow>
                <TableCell
                  className="px-3 py-2 text-muted-foreground"
                  colSpan={7}
                >
                  No sites yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {!!data && data.total > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground pb-2 md:pb-0">
            Showing {page * pageSize + 1}–
            {Math.min(data.total, (page + 1) * pageSize)} of {data.total}
          </p>
          <div className="flex items-center gap-2">
            <SmartPagination
              page={data.page}
              totalPages={totalPages}
              onPageChange={setPage}
              onReady={() => setSelected({})}
              siblingCount={2}
            />
          </div>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {editing && (
            <EditForm
              type="Edit"
              initial={editing}
              onClose={() => {
                setEditing(null);
                mutate();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
