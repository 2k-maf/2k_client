/**
 * Перевірки public/_redirects. Запуск: node --test edge/
 *
 * Сам редирект виконує Cloudflare Pages, тут лише ловимо розбіжності з
 * рештою конфігурації, які інакше видно тільки в проді.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

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

test('_redirects: кнопки соцмереж ведуть на короткі посилання', () => {
    const constants = Object.fromEntries(
        [...read('../src/components/SocialLinks.tsx').matchAll(/export const (\w+)_URL = '([^']+)'/g)]
            .map(([, name, url]) => [name.toLowerCase(), url]),
    );
    assert.deepEqual(Object.keys(constants).sort(), ['instagram', 'telegram', 'threads', 'youtube']);
    for (const [name, url] of Object.entries(constants)) {
        assert.equal(url, `https://2kmaf.ca/${name}`, `${name.toUpperCase()}_URL має бути коротким посиланням`);
    }
});

// Посилання на 2kmaf.ca/<шлях> без правила відкрило б сторінку 404 SPA.
test('_redirects: кожне коротке посилання в src/ має правило з / і без', () => {
    const src = new URL('../src/', import.meta.url);
    const paths = new Set();
    for (const file of readdirSync(src, { recursive: true })) {
        if (!/\.tsx?$/.test(file)) continue;
        for (const [, path] of read(`../src/${file.replaceAll('\\', '/')}`).matchAll(/https:\/\/2kmaf\.ca\/(\w+)/g)) {
            paths.add(path);
        }
    }
    assert.ok(paths.size > 0);
    for (const path of paths) {
        for (const source of [`/${path}`, `/${path}/`]) {
            assert.ok(redirects.some((x) => x.source === source), `немає правила ${source} у _redirects`);
        }
    }
});
