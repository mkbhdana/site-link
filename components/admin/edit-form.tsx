"use client";

import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Site } from "@/types/site";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Enter a valid URL").min(1, "URL is required"),
  logoUrl: z.string().url("Must be http(s) URL").optional(),
  lightLogoUrl: z.string().url("Must be http(s) URL").optional(),
  darkLogoUrl: z.string().url("Must be http(s) URL").optional(),
  status: z.enum(["approved", "pending"]).default("approved"),
  live: z.enum(["up", "down"]).default("up"),
});

interface FormValues {
  name: string;
  url: string;
  logoUrl?: string;
  lightLogoUrl?: string;
  darkLogoUrl?: string;
  status: "approved" | "pending";
  live: "up" | "down";
}

export function EditForm({
  initial,
  type,
  onClose,
}: {
  initial?: Partial<Site>;
  type: string;
  onClose: () => void;
}) {
  const isEdit = Boolean(initial?._id);

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: initial?.name ?? "",
      url: initial?.url ?? "",
      logoUrl: initial?.logoUrl ?? undefined,
      lightLogoUrl: initial?.lightLogoUrl ?? undefined,
      darkLogoUrl: initial?.darkLogoUrl ?? undefined,
      status: (initial?.status as "approved" | "pending") ?? "approved",
      live: (initial?.live as "up" | "down") ?? "up",
    }),
    [initial]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues,
    mode: "onChange",
  });

  const [isPending, startTransition] = useTransition();

  const { isValid, isSubmitting, isValidating, isDirty } = form.formState;

  async function handleSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      url: values.url,
      logoUrl: values.logoUrl || null,
      lightLogoUrl: values.lightLogoUrl || null,
      darkLogoUrl: values.darkLogoUrl || null,
      status: values.status,
      live: values.live,
    };

    const endpoint = isEdit ? `/api/sites/${initial?._id}` : "/api/sites";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Request failed");
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await handleSubmit(values);
        toast.success(
          isEdit
            ? "Site details updated succesfully."
            : "Site details added succesfully."
        );
        onClose();
      } catch (e: any) {
        const msg =
          e?.message ||
          (isEdit
            ? "Updating Site Details Failed."
            : "Adding Site Details Failed.");
        toast.error(msg);
      }
    });
  });

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          if (!isValid) {
            e.preventDefault();
            return;
          }
          return onSubmit(e);
        }}
        className="space-y-6 p-2"
      >
        <DialogHeader>
          <DialogTitle>{`${type} Site`}</DialogTitle>
        </DialogHeader>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input type="url" required {...field} />
              </FormControl>
              <FormDescription>Include protocol, e.g. https://</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL (fallback, optional)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="Optional"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lightLogoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Light Logo URL (used in light theme)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="Optional"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="darkLogoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dark Logo URL (used in dark theme)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="Optional"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="approved">approved</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="live"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Live</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Live status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="up">Up</SelectItem>
                    <SelectItem value="down">Down</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              className="h-9 bg-transparent"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            className="h-9"
            disabled={!isValid || !isDirty || isSubmitting || isValidating}
          >
            {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
