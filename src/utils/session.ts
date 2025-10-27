const SESSION_KEY = "givoro_session_id";

export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSessionId(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}
