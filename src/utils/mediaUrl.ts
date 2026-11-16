import axios from '../axios';

/** Remote/API-hosted images (S3, or paths relative to API base). */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (url == null || typeof url !== 'string') return undefined;
  const u = url.trim();
  if (!u) return undefined;
  if (/^data:/i.test(u)) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('//')) return `https:${u}`;
  const base = String(axios.defaults.baseURL || '').replace(/\/$/, '');
  if (u.startsWith('/')) {
    if (base) return `${base}${u}`;
    if (typeof window !== 'undefined') return `${window.location.origin}${u}`;
    return u;
  }
  if (base) return `${base}/${u}`;
  return u;
}

/** Static files from `public/` (always root-relative so deep routes resolve correctly). */
export function publicStaticUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${normalized}`;
}
