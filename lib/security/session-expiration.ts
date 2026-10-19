export function isSiteSessionExpired(
  sessionExpiresAt: number | null,
  now = Date.now()
) {
  return sessionExpiresAt !== null && sessionExpiresAt <= now
}
