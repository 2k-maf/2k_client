import * as React from 'react';
import DvaKoloryLogo from './brand/DvaKoloryLogo';

/**
 * Історична назва компонента з шаблону; тепер це просто знак Dva Kol'ory.
 * Лишається, бо на нього посилаються екрани авторизації та хедер.
 */
export default function SitemarkIcon({
  variant = 'red',
  size = 34,
  withWordmark = true,
}: {
  variant?: 'navy' | 'red';
  size?: number;
  withWordmark?: boolean;
}) {
  return <DvaKoloryLogo variant={variant} size={size} withWordmark={withWordmark} />;
}
