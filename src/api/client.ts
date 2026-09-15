import axios from "axios";

// 배포 환경 등에서 API 주소를 고정하고 싶으면 VITE_API_URL을 지정.
// 지정하지 않으면 지금 접속한 주소(호스트)의 4001번 포트를 그대로 사용한다.
// 예: PC에서 http://localhost:5173 로 열면 -> http://localhost:4001/api
//     휴대폰에서 http://192.168.0.15:5173 로 열면 -> http://192.168.0.15:4001/api
const API_URL =
  import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4001/api`;

export const api = axios.create({ baseURL: API_URL });

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function resolveUploadUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_URL.replace(/\/api\/?$/, "")}${path}`;
}
