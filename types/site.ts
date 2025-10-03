export type SiteStatus = "approved" | "pending";

export interface Site {
  _id?: string;
  name: string;
  url: string;
  logoUrl?: string;
  lightLogoUrl?: string;
  darkLogoUrl?: string;
  status: SiteStatus;
  // live uptime meta
  live?: "up" | "down";
  lastChecked?: string;
  createdAt?: string;
  updatedAt?: string;
}
