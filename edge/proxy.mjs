/**
 * Pages Function — єдина точка входу для динамічних шляхів.
 *
 * Замінює CloudFront: AWS відмовив новому акаунту в доступі до CloudFront,
 * тому маршрутизацію робить Cloudflare. Див. ADR 0006 у 2k_api.
 *
 *   шляхи API      → Lambda Function URL + заголовок x-origin-secret
 *   /avatars/*     → приватний бакет S3, підписаний GET, кеш Cloudflare
 *   решта          → статика Pages (сюди функція не викликається взагалі,
 *                    див. public/_routes.json)
 *
 * Статика й API на одному домені, тому CORS не потрібен.
 */
import { AwsClient } from 'aws4fetch';

// Той самий набір, що давав Managed-SecurityHeadersPolicy у CloudFront.
// public/_headers на відповіді функції не діє, тому ставимо тут.
export const SECURITY_HEADERS = {
    'strict-transport-security': 'max-age=31536000',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'SAMEORIGIN',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-xss-protection': '1; mode=block',
};

// Ключ S3 детермінований (avatars/<userId>.<ext>), нову картинку від старої
// відрізняє лише ?t=. Тому ?t= входить у ключ кешу, а сам кеш довгий.
const AVATAR_MAX_AGE = 30 * 24 * 60 * 60;

// Заголовки, які не можна пересилати в origin. host виставляє fetch сам:
// Function URL відповідає помилкою, якщо Host не збігається з його адресою.
const HOP_HEADERS = ['host', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade'];

export async function handle(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/avatars/')) {
        return withSecurityHeaders(await serveAvatar(request, env, ctx, url));
    }

    // SPA-маршрут /clubs і API GET /clubs мають однаковий шлях. Браузер, що
    // відкриває сторінку (оновлення, пряме посилання), має отримати
    // index.html, а не JSON. axios ніколи не надсилає Accept: text/html.
    if (isNavigation(request)) {
        return withSecurityHeaders(await env.ASSETS.fetch(new Request(new URL('/', url), request)));
    }

    return withSecurityHeaders(await proxyApi(request, env, url));
}

export function isNavigation(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') return false;
    if (request.headers.get('sec-fetch-mode') === 'navigate') return true;
    return (request.headers.get('accept') || '').includes('text/html');
}

async function proxyApi(request, env, url) {
    if (!env.API_ORIGIN || !env.ORIGIN_SECRET) {
        console.error('API_ORIGIN або ORIGIN_SECRET не задано в змінних Pages');
        return json(500, { message: 'Server misconfigured' });
    }

    const target = new URL(url.pathname + url.search, env.API_ORIGIN);

    const headers = new Headers(request.headers);
    for (const name of HOP_HEADERS) headers.delete(name);
    // set, а не append: значення від клієнта перезаписується.
    headers.set('x-origin-secret', env.ORIGIN_SECRET);

    const init = { method: request.method, headers, redirect: 'manual' };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body;
        init.duplex = 'half';
    }

    try {
        return await fetch(target, init);
    } catch (e) {
        console.error(`Lambda недоступна: ${e?.message}`);
        return json(502, { message: 'Bad gateway' });
    }
}

async function serveAvatar(request, env, ctx, url) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, HEAD' } });
    }
    if (!env.AVATARS_BUCKET || !env.AVATARS_READER_KEY_ID || !env.AVATARS_READER_SECRET) {
        console.error('Змінні AVATARS_* не задано в змінних Pages');
        return new Response('Server misconfigured', { status: 500 });
    }

    // Cache API працює лише на власному домені; на *.pages.dev caches.default
    // є, але нічого не зберігає. Тоді просто щоразу йдемо в S3.
    const cache = typeof caches !== 'undefined' ? caches.default : null;
    const cacheKey = new Request(url.toString(), { method: 'GET' });
    if (cache) {
        const hit = await cache.match(cacheKey);
        if (hit) return request.method === 'HEAD' ? new Response(null, hit) : hit;
    }

    const region = env.AVATARS_REGION || 'us-west-2';
    // ?t= до S3 не передаємо: це лише ключ кешу на нашому боці.
    const s3Url = `https://${env.AVATARS_BUCKET}.s3.${region}.amazonaws.com${url.pathname}`;
    const aws = new AwsClient({
        accessKeyId: env.AVATARS_READER_KEY_ID,
        secretAccessKey: env.AVATARS_READER_SECRET,
        service: 's3',
        region,
    });

    let upstream;
    try {
        upstream = await aws.fetch(s3Url, { method: 'GET' });
    } catch (e) {
        console.error(`S3 недоступний: ${e?.message}`);
        return new Response('Bad gateway', { status: 502 });
    }

    // Без s3:ListBucket відсутній ключ S3 віддає 403, а не 404.
    // Обидва випадки для клієнта — "аватара немає".
    if (upstream.status === 403 || upstream.status === 404) {
        return new Response('Not found', { status: 404, headers: { 'cache-control': 'public, max-age=60' } });
    }
    if (!upstream.ok) {
        console.error(`S3 відповів ${upstream.status} на ${url.pathname}`);
        return new Response('Bad gateway', { status: 502 });
    }

    const headers = new Headers({
        'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
        'cache-control': `public, max-age=${AVATAR_MAX_AGE}`,
    });
    for (const name of ['etag', 'last-modified', 'content-length']) {
        const value = upstream.headers.get(name);
        if (value) headers.set(name, value);
    }
    const response = new Response(upstream.body, { status: 200, headers });

    if (cache) ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return request.method === 'HEAD' ? new Response(null, response) : response;
}

function withSecurityHeaders(response) {
    // Відповідь fetch має незмінні заголовки — копіюємо.
    const out = new Response(response.body, response);
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
        if (!out.headers.has(name)) out.headers.set(name, value);
    }
    return out;
}

function json(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}
