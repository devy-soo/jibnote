import { create } from "zustand";
import { api } from "../api/client";
import { RENT_TYPES } from "../constants/dealTypes";
import type { Agent, ChecklistState, DealType, Listing, ListingStatus, RatingState } from "../types";

export interface ListingPayload {
  title: string;
  listingNumber?: string;
  platform?: string;
  sourceUrl?: string;
  buildingType?: string;
  dealType: DealType;
  deposit: number;
  monthlyRent?: number;
  areaSqm?: number;
  rooms?: number;
  floor?: string;
  totalFloors?: number;
  approvalDate?: string;
  isViolationBuilding?: boolean;
  isFakeListing?: boolean;
  parkingAvailable?: boolean;
  options: string[];
  maintenanceFee?: number;
  maintenanceFeeIncludes: string[];
  walkMinutes?: number;
  nearestStation?: string;
  address?: string;
  agents: Agent[];
  memo?: string;
  status: ListingStatus;
  tags: string[];
  newPhotos: File[];
  /**
   * 수정 시에만 사용: 최종 사진 순서. 배열의 각 항목은 기존 사진 id 또는
   * "__new__" (newPhotos의 다음 파일을 그 자리에 배치) 중 하나.
   */
  photoOrder?: string[];
}

type PatchFields = Partial<{
  status: ListingStatus;
  saved: boolean;
  memo: string;
  visitNote: string;
  checklist: ChecklistState;
  ratings: RatingState;
  agents: Agent[];
}>;

interface ListingStore {
  listings: Listing[];
  loaded: boolean;
  loading: boolean;
  fetchAll: () => Promise<void>;
  reset: () => void;
  createListing: (payload: ListingPayload) => Promise<Listing>;
  editListing: (id: string, payload: ListingPayload) => Promise<Listing>;
  patchListing: (id: string, patch: PatchFields) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
  toggleSaved: (id: string) => Promise<void>;
}

function buildFormData(payload: ListingPayload): FormData {
  const fd = new FormData();
  fd.append("title", payload.title);
  if (payload.listingNumber) fd.append("listingNumber", payload.listingNumber);
  if (payload.platform) fd.append("platform", payload.platform);
  if (payload.sourceUrl) fd.append("sourceUrl", payload.sourceUrl);
  if (payload.buildingType) fd.append("buildingType", payload.buildingType);
  fd.append("dealType", payload.dealType);
  fd.append("deposit", String(payload.deposit));
  if (RENT_TYPES.includes(payload.dealType) && payload.monthlyRent != null) {
    fd.append("monthlyRent", String(payload.monthlyRent));
  }
  if (payload.areaSqm != null) fd.append("areaSqm", String(payload.areaSqm));
  if (payload.rooms != null) fd.append("rooms", String(payload.rooms));
  if (payload.floor) fd.append("floor", payload.floor);
  if (payload.totalFloors != null) fd.append("totalFloors", String(payload.totalFloors));
  if (payload.approvalDate) fd.append("approvalDate", payload.approvalDate);
  if (payload.isViolationBuilding != null) {
    fd.append("isViolationBuilding", String(payload.isViolationBuilding));
  }
  if (payload.isFakeListing != null) {
    fd.append("isFakeListing", String(payload.isFakeListing));
  }
  if (payload.parkingAvailable != null) {
    fd.append("parkingAvailable", String(payload.parkingAvailable));
  }
  fd.append("options", JSON.stringify(payload.options));
  if (payload.maintenanceFee != null) fd.append("maintenanceFee", String(payload.maintenanceFee));
  fd.append("maintenanceFeeIncludes", JSON.stringify(payload.maintenanceFeeIncludes));
  if (payload.walkMinutes != null) fd.append("walkMinutes", String(payload.walkMinutes));
  if (payload.nearestStation) fd.append("nearestStation", payload.nearestStation);
  if (payload.address) fd.append("address", payload.address);
  fd.append("agents", JSON.stringify(payload.agents));
  if (payload.memo) fd.append("memo", payload.memo);
  fd.append("status", payload.status);
  fd.append("tags", JSON.stringify(payload.tags));
  if (payload.photoOrder) fd.append("photoOrder", JSON.stringify(payload.photoOrder));
  for (const file of payload.newPhotos) fd.append("photos", file);
  return fd;
}

export const useListingStore = create<ListingStore>((set, get) => ({
  listings: [],
  loaded: false,
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/listings");
      set({ listings: res.data.listings, loaded: true, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  reset: () => set({ listings: [], loaded: false }),

  createListing: async (payload) => {
    const res = await api.post("/listings", buildFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const listing: Listing = res.data.listing;
    set((s) => ({ listings: [listing, ...s.listings] }));
    return listing;
  },

  editListing: async (id, payload) => {
    const res = await api.put(`/listings/${id}`, buildFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const listing: Listing = res.data.listing;
    set((s) => ({ listings: s.listings.map((l) => (l.id === id ? listing : l)) }));
    return listing;
  },

  patchListing: async (id, patch) => {
    const prev = get().listings;
    const target = prev.find((l) => l.id === id);
    if (!target) return;
    const optimistic = { ...target, ...patch, updatedAt: Date.now() };
    set({ listings: prev.map((l) => (l.id === id ? optimistic : l)) });
    try {
      const res = await api.patch(`/listings/${id}`, patch);
      const listing: Listing = res.data.listing;
      set((s) => ({ listings: s.listings.map((l) => (l.id === id ? listing : l)) }));
    } catch (err) {
      set({ listings: prev });
      throw err;
    }
  },

  removeListing: async (id) => {
    const prev = get().listings;
    set({ listings: prev.filter((l) => l.id !== id) });
    try {
      await api.delete(`/listings/${id}`);
    } catch (err) {
      set({ listings: prev });
      throw err;
    }
  },

  toggleSaved: async (id) => {
    const target = get().listings.find((l) => l.id === id);
    if (!target) return;
    await get().patchListing(id, { saved: !target.saved });
  },
}));
