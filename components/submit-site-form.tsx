"use client";

import { useTransition } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(1, "Site name is required"),
  url: z.string().min(1, "URL is required").url("Enter a valid URL"),
  logoUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().url("Enter a valid URL").optional()),
  lightLogoUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().url("Enter a valid URL").optional()),
  darkLogoUrl: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .pipe(z.string().url("Enter a valid URL").optional()),
});

type FormValues = z.infer<typeof schema>;

export function SubmitSiteForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      url: "",
      logoUrl: "",
      lightLogoUrl: "",
      darkLogoUrl: "",
    },
    mode: "onSubmit",
  });

  const [isPending, startTransition] = useTransition();

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    startTransition(async () => {
      form.clearErrors();
      try {
        const res = await fetch("/api/public/submit-site", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name.trim(),
            url: values.url.trim(),
            logoUrl: values.logoUrl, // already coerced to undefined if empty
            lightLogoUrl: values.lightLogoUrl,
            darkLogoUrl: values.darkLogoUrl,
          }),
        });

        if (!res.ok) throw new Error("Failed to submit");

        form.reset({
          name: "",
          url: "",
          logoUrl: "",
          lightLogoUrl: "",
          darkLogoUrl: "",
        });

        // Imperative success notice via RHF form state
        // Optionally set a local flag or toast here
        form.setError("root", {
          type: "success",
          message: "Thanks! Your link is pending approval.",
        });
      } catch (err: any) {
        form.setError("root", {
          type: "server",
          message: err?.message || "Something went wrong",
        });
      }
    });
  };

  const rootMsg = form.formState.errors.root?.message;
  const isSuccess = form.formState.errors.root?.type === "success";
  const isError =
    form.formState.errors.root && form.formState.errors.root.type !== "success";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="grid gap-3">
              <FormLabel className="text-sm font-medium">Site name</FormLabel>
              <FormControl>
                <Input placeholder="Vercel" disabled={isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem className="grid gap-3">
              <FormLabel className="text-sm font-medium">URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://vercel.com"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem className="grid gap-3">
              <FormLabel className="text-sm font-medium">
                Logo URL (fallback, optional)
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  disabled={isPending}
                  {...field}
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
            <FormItem className="grid gap-3">
              <FormLabel className="text-sm font-medium">
                Light Logo URL (shown in light theme)
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/logo-light.png"
                  disabled={isPending}
                  {...field}
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
            <FormItem className="grid gap-3">
              <FormLabel className="text-sm font-medium">
                Dark Logo URL (shown in dark theme)
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/logo-dark.png"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                If a theme-specific logo is missing, the other one will be used
                or it will fall back to the site favicon.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending} className="h-9">
          {isPending ? "Submitting..." : "Submit for approval"}
        </Button>

        {isSuccess && <div className="text-sm text-green-600">{rootMsg}</div>}
        {isError && <div className="text-sm text-destructive">{rootMsg}</div>}
      </form>
    </Form>
  );
}
