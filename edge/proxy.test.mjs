/**
 * Тести Pages Function. Запуск: node --test edge/
 *
 * Мережу підміняємо: globalThis.fetch записує запит і повертає заготовку.
 * aws4fetch теж ходить через globalThis.fetch, тож підпис S3 видно в запиті.
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { handle, isNavigation } from './proxy.mjs';

const ENV = {
    API_ORIGIN: 'https://abc123.lambda-url.us-west-2.on.aws',
    ORIGIN_SECRET: 'secret-from-terraform',
    AVATARS_BUCKET: '2k-maf-prod-avatars',
    AVATARS_REGION: 'us-west-2',
    AVATARS_READER_KEY_ID: 'AKIAEXAMPLE',
    AVATARS_READER_SECRET: 'example-secret',
    ASSETS: { fetch: async (req) => new Response('<html>index</html>', { headers: { 'content-type': 'text/html' }, _url: req.url }) },
};
const CTX = { waitUntil() {} };

let calls;
let reply;
beforeEach(() => {
    calls = [];
    reply = () => new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } });
    globalThis.fetch = async (input, init) => {
        const req = new Request(input, init);
        calls.push({ url: req.url, method: req.method, headers: req.headers, body: init?.body ? await req.text() : null });
        return reply(req);
    };
});

test('API: шлях і query йдуть у Function URL, секрет додано', async () => {
    const res = await handle(new Request('https://site.test/clubs?page=2', { headers: { accept: 'application/json' } }), ENV, CTX);
    assert.equal(res.status, 200);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://abc123.lambda-url.us-west-2.on.aws/clubs?page=2');
    assert.equal(calls[0].headers.get('x-origin-secret'), 'secret-from-terraform');
});

test('API: секрет від клієнта перезаписується', async () => {
    await handle(new Request('https://site.test/users', { headers: { 'x-origin-secret': 'forged' } }), ENV, CTX);
    assert.equal(calls[0].headers.get('x-origin-secret'), 'secret-from-terraform');
});

test('API: тіло POST і Authorization доходять до Lambda', async () => {
    const body = JSON.stringify({ email: 'a@b.c', password: 'x' });
    await handle(new Request('https://site.test/auth/login', {
        method: 'POST', body, headers: { 'content-type': 'application/json', authorization: 'Bearer t' },
    }), ENV, CTX);
    assert.equal(calls[0].method, 'POST');
    assert.equal(calls[0].body, body);
    assert.equal(calls[0].headers.get('authorization'), 'Bearer t');
});

test('API: статус і тіло Lambda повертаються як є, плюс security headers', async () => {
    reply = () => new Response('{"message":"Forbidden"}', { status: 403 });
    const res = await handle(new Request('https://site.test/user'), ENV, CTX);
    assert.equal(res.status, 403);
    assert.equal(await res.text(), '{"message":"Forbidden"}');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('API: без змінних — 500, а не запит без секрету', async () => {
    const res = await handle(new Request('https://site.test/users'), { ...ENV, ORIGIN_SECRET: '' }, CTX);
    assert.equal(res.status, 500);
    assert.equal(calls.length, 0);
});

test('навігація браузера на /clubs віддає index.html, а не JSON', async () => {
    const res = await handle(new Request('https://site.test/clubs', {
        headers: { accept: 'text/html,application/xhtml+xml', 'sec-fetch-mode': 'navigate' },
    }), ENV, CTX);
    assert.equal(calls.length, 0);
    assert.equal(await res.text(), '<html>index</html>');
});

test('isNavigation: axios за замовчуванням навігацією не є', () => {
    assert.equal(isNavigation(new Request('https://s/clubs', { headers: { accept: 'application/json, text/plain, */*' } })), false);
    assert.equal(isNavigation(new Request('https://s/clubs', { method: 'POST', headers: { accept: 'text/html' } })), false);
});

test('аватар: підписаний GET у S3 без ?t=, довгий кеш', async () => {
    reply = () => new Response('JPEGDATA', { headers: { 'content-type': 'image/jpeg', etag: '"e1"' } });
    const res = await handle(new Request('https://site.test/avatars/u1.jpg?t=123'), ENV, CTX);
    assert.equal(res.status, 200);
    assert.equal(calls[0].url, 'https://2k-maf-prod-avatars.s3.us-west-2.amazonaws.com/avatars/u1.jpg');
    assert.match(calls[0].headers.get('authorization'), /^AWS4-HMAC-SHA256 Credential=AKIAEXAMPLE\/\d{8}\/us-west-2\/s3\/aws4_request/);
    assert.equal(res.headers.get('content-type'), 'image/jpeg');
    assert.equal(res.headers.get('cache-control'), 'public, max-age=2592000');
    assert.equal(await res.text(), 'JPEGDATA');
});

test('аватар: 403 від S3 (ключа немає) стає 404', async () => {
    reply = () => new Response('<Error/>', { status: 403 });
    const res = await handle(new Request('https://site.test/avatars/missing.jpg'), ENV, CTX);
    assert.equal(res.status, 404);
});

test('аватар: запис заборонено', async () => {
    const res = await handle(new Request('https://site.test/avatars/u1.jpg', { method: 'PUT', body: 'x' }), ENV, CTX);
    assert.equal(res.status, 405);
    assert.equal(calls.length, 0);
});

test('_routes.json містить усі кореневі маршрути API й аватари', () => {
    const routes = JSON.parse(readFileSync(new URL('../public/_routes.json', import.meta.url), 'utf8'));
    for (const p of ['/auth/*', '/clubs', '/club/*', '/user', '/user/*', '/users', '/tournaments', '/tournament/*', '/public/*', '/avatars/*']) {
        assert.ok(routes.include.includes(p), `немає ${p}`);
    }
    // Статика не має викликати функцію — інакше згорає безкоштовний ліміт.
    for (const p of ['/*', '/static/*', '/']) assert.ok(!routes.include.includes(p), `зайвий ${p}`);
});
