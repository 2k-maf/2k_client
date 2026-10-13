import { useEffect } from 'react';

/** Назва сайту. Те саме значення стоїть у <title> файлу public/index.html. */
export const SITE_NAME = "Dva Kol'ory";

/**
 * Заголовок вкладки: «Сторінка · Dva Kol'ory». Без назви сторінки — лише назва сайту.
 * Кожен маршрут задає заголовок сам, тому попередня сторінка не лишає свій.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
