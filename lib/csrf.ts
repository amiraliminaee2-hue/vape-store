// ذخیره توکن‌ها در حافظه (برای Production از Redis استفاده کن)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

export function validateCsrfToken(userId: string, token: string): boolean {
  const stored = csrfTokens.get(userId);
  if (!stored) return false;
  if (stored.expiresAt < Date.now()) {
    csrfTokens.delete(userId);
    return false;
  }
  return stored.token === token;
}

// برای افزودن توکن به map (اختیاری)
export function setCsrfToken(userId: string, token: string, expiresAt: number) {
  csrfTokens.set(userId, { token, expiresAt });
}