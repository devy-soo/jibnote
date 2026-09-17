import { api } from "./client";
import type { DealType } from "../types";

export interface ExtractedListing {
  title?: string;
  dealType?: DealType;
  deposit?: number;
  monthlyRent?: number;
  area?: string;
  floor?: string;
  maintenanceFee?: number;
  walkMinutes?: number;
  address?: string;
  agentName?: string;
  agentPhone?: string;
}

export async function extractListingFromPhoto(file: File): Promise<ExtractedListing> {
  const fd = new FormData();
  fd.append("photo", file);
  const res = await api.post("/listings/extract", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.extracted as ExtractedListing;
}
