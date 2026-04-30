// Persistent anonymous visitor id (client-only). Used to detect returning users.

const KEY = "md_visitor_id";

export function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

const LAST_SESSION_KEY = "md_last_session_id";

export function setLastSessionId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SESSION_KEY, id);
}

export function getLastSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_SESSION_KEY);
}
