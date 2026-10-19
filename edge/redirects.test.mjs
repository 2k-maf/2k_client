/**
 * Перевірки public/_redirects. Запуск: node --test edge/
 *
 * Сам редирект виконує Cloudflare Pages, тут лише ловимо розбіжності з
 * рештою конфігурації, які інакше видно тільки в проді.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const redirects = read('../public/_redirects')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
        const [source, destination, code] = line.split(/\s+/);
        return { source, destination, code };
    });

test('_redirects: файл не порожній, кожне правило має явний код 302', () => {
    assert.ok(redirects.length > 0);
    for (const r of redirects) {
        assert.equal(r.code, '302', `${r.source}: 301 браузер кешує без строку`);
    }
});

// На шляхи функції Pages не застосовує _redirects: запит пішов би в API.
test('_redirects: жоден шлях не потрапляє у функцію з _routes.json', () => {
    const { include } = JSON.parse(read('../public/_routes.json'));
    const matches = (pattern, path) => pattern.endsWith('/*')
        ? path.startsWith(pattern.slice(0, -1))
        : pattern === path;
    for (const r of redirects) {
        const hit = include.find((pattern) => matches(pattern, r.source));
        assert.equal(hit, undefined, `${r.source} збігається з ${hit} у _routes.json`);
    }
});

test('_redirects: адреси соцмереж збігаються з SocialLinks.tsx', () => {
    const constants = Object.fromEntries(
        [...read('../src/components/SocialLinks.tsx').matchAll(/export const (\w+)_URL = '([^']+)'/g)]
            .map(([, name, url]) => [name.toLowerCase(), url]),
    );
    assert.deepEqual(Object.keys(constants).sort(), ['instagram', 'telegram', 'threads', 'youtube']);
    for (const [name, url] of Object.entries(constants)) {
        for (const source of [`/${name}`, `/${name}/`]) {
            const r = redirects.find((x) => x.source === source);
            assert.ok(r, `немає короткого посилання ${source}`);
            assert.equal(r.destination, url, `${source} веде не туди, куди кнопка на сайті`);
        }
    }
});
