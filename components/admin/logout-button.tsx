"use client";

import { Button } from "../ui/button";

export function LogoutButton() {
  async function handleLogout() {
    try {
      await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      window.location.href = "/admin/login";
    } catch (err) {
      console.error("[v0] Logout error:", err);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      className="h-9"
      aria-label="Logout"
    >
      Logout
    </Button>
  );
}
