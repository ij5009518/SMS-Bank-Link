export function getApiUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const clean = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${clean}${path}`;
}
