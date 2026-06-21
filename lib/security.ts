const BLACKLIST = ['google.com', 'facebook.com', 'amazon.com', 'microsoft.com', ...];

export function isAllowedTarget(target: string): boolean {
  const normalized = target.toLowerCase();
  if (BLACKLIST.some(b => normalized.includes(b))) return false;
  return /^([a-z0-9-]+\.)+[a-z]{2,}$|^(\d{1,3}\.){3}\d{1,3}$/.test(normalized);
}

export async function rateLimit(userId: string, tool: string) {
  // Implementar com Redis ou Prisma + TTL na produção
}
