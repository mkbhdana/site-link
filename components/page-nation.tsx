import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

type Props = {
  page: number; // zero-based
  totalPages: number; // total pages (>= 1)
  onPageChange: (p: number) => void; // expects zero-based
  onReady?: () => void;
  siblingCount?: number; // how many neighbors around current (default 2)
};

function getRange(start: number, end: number) {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
}

function buildPages(currentZero: number, totalPages: number, siblingCount = 2) {
  // Internally work one-based for simpler math
  const current = currentZero + 1;
  const first = 1;
  const last = Math.max(1, totalPages);

  if (last <= 1) return [1];

  const left = Math.max(first + 1, current - siblingCount);
  const right = Math.min(last - 1, current + siblingCount);

  const pages: (number | "...")[] = [];

  // Always show first
  pages.push(first);

  // Left gap
  if (left > first + 1) {
    pages.push("...");
  } else if (left === first + 1) {
    // no ellipsis if contiguous
  }

  // Middle window
  if (left <= right) {
    pages.push(...getRange(left, right));
  }

  // Right gap
  if (right < last - 1) {
    pages.push("...");
  } else if (right === last - 1) {
    // no ellipsis if contiguous
  }

  // Always show last (avoid dup)
  if (last !== first) pages.push(last);

  // De-dup in case of overlap
  const dedup: (number | "...")[] = [];
  let prev: number | "..." | null = null;
  for (const p of pages) {
    if (p !== prev) dedup.push(p);
    prev = p;
  }

  return dedup;
}

export function SmartPagination({
  page,
  totalPages,
  onPageChange,
  onReady,
  siblingCount = 2,
}: Props) {
  const items = buildPages(page, totalPages, siblingCount);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <Pagination>
      <PaginationContent className="flex items-center gap-2">
        {canPrev && (
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(Math.max(0, page - 1));
                onReady?.();
              }}
            />
          </PaginationItem>
        )}

        {items.map((it, idx) => {
          if (it === "...") {
            return (
              <PaginationItem key={`ellipsis-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          const oneBased = it as number;
          const zeroBased = oneBased - 1;
          const isActive = zeroBased === page;

          return (
            <PaginationItem key={oneBased}>
              <PaginationLink
                href="#"
                isActive={isActive}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(zeroBased);
                }}
              >
                {oneBased}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {canNext && (
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onPageChange(Math.min(totalPages - 1, page + 1));
              }}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
