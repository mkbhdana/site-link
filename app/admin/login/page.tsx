"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.password }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Login failed");
      }

      router.push("/admin");
    } catch (err: any) {
      form.setError("root", {
        type: "server",
        message: err?.message || "Login failed",
      });
    }
  }

  const rootMsg = form.formState.errors.root?.message;

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <h1 className="mb-2 text-xl font-semibold">Admin Login</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter the admin password to continue.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="grid gap-2">
                <FormLabel className="text-sm font-medium">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="******"
                    className="h-9 rounded-md border bg-background px-3 text-sm"
                    disabled={form.formState.isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="h-9"
          >
            {form.formState.isSubmitting ? "Signing in..." : "Sign In"}
          </Button>

          {rootMsg && <div className="text-sm text-destructive">{rootMsg}</div>}
        </form>
      </Form>
    </main>
  );
}
