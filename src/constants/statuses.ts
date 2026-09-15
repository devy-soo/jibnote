import type { ListingStatus } from "../types";

export const STATUS_OPTIONS: {
  value: ListingStatus;
  ink: string;
  bg: string;
}[] = [
  { value: "관심", ink: "#1D3FAF", bg: "#E8EEFD" },
  { value: "방문예정", ink: "#0A7590", bg: "#E1F5F9" },
  { value: "방문완료", ink: "#5B37C4", bg: "#EEE9FC" },
  { value: "계약진행", ink: "#0B7355", bg: "#E2F6EF" },
];

export function statusStyle(status: ListingStatus) {
  return (
    STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0]
  );
}

export const FILTER_OPTIONS: ("전체" | ListingStatus)[] = [
  "전체",
  "관심",
  "방문예정",
  "방문완료",
  "계약진행",
];
