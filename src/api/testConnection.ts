// frontend/src/api/testConnection.ts
// In production with Nginx proxy, use relative URLs (empty string)
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export type ConnectionStatus = { connected: boolean; message: string };

export async function testConnection(): Promise<ConnectionStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/ping`, {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { connected: true, message: data.status ?? "OK" };
    }
    return { connected: false, message: `HTTP ${res.status}` };
  } catch (e: any) {
    return { connected: false, message: e?.message ?? "Network error" };
  }
}