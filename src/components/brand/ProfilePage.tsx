import * as React from 'react';
import { useLocation } from 'react-router-dom';
import BrandPage from './BrandPage';
import BrandTabs, { BrandTab } from './BrandTabs';
import { useAuth } from '../../AuthProvider';

const HOME_TAB: BrandTab = { label: 'Головна', to: '/profile' };
const CLUB_TAB: BrandTab = { label: 'Учасники', to: '/profile/users' };
const MEMBER_TABS: BrandTab[] = [
  { label: 'Ігри', to: '/profile/games' },
  { label: 'Клуби', to: '/profile/clubs' },
];
/** Статистика ведучих і редагування їхніх ігор. */
const HOSTS_TAB: BrandTab = { label: 'Ведучі', to: '/profile/hosts' };
const SHARED_TABS: BrandTab[] = [
  { label: 'Рейтинговий період', to: '/profile/rating-periods' },
  { label: 'Турніри', to: '/profile/tournaments' },
];

/**
 * Розділи кабінету залежать від типу акаунта: клуб веде учасників, гравець — свої ігри.
 * Вкладку «Ведучі» бачать клуб і гравець зі значком ведучого.
 */
function profileTabs(isClub: boolean, isHost: boolean): BrandTab[] {
  const hostTabs = isClub ? [HOSTS_TAB] : isHost ? [{ ...HOSTS_TAB, label: 'Ведучий' }] : [];
  return [HOME_TAB, ...(isClub ? [CLUB_TAB] : MEMBER_TABS), ...hostTabs, ...SHARED_TABS];
}

/**
 * Вкладка вважається активною і на вкладених маршрутах: `/profile/tournaments/new`
 * та `/profile/tournament/:id/game/:i` підсвічують «Турніри».
 */
function activeTab(tabs: BrandTab[], pathname: string): string {
  if (pathname.startsWith('/profile/tournament')) return '/profile/tournaments';
  const match = tabs.find((tab) => tab.to !== '/profile' && pathname.startsWith(tab.to));
  return match ? match.to : HOME_TAB.to;
}

type Props = {
  title: string;
  /** Заголовок вкладки, якщо він інший, ніж `title`. */
  documentTitle?: string;
  children: React.ReactNode;
};

/**
 * Каркас кабінету: той самий `BrandPage`, що й на публічних сторінках, плюс
 * рядок вкладок замість бічного меню шаблону MUI.
 */
export default function ProfilePage({ title, documentTitle, children }: Props) {
  const { user, isHost } = useAuth();
  const { pathname } = useLocation();
  const isClub = user?.authType === 'Клуб';
  const tabs = profileTabs(isClub, isHost);

  return (
    <BrandPage
      eyebrow={isClub ? 'Кабінет клубу' : 'Кабінет учасника'}
      title={title}
      documentTitle={documentTitle}
      subnav={<BrandTabs tabs={tabs} activeTo={activeTab(tabs, pathname)} />}
    >
      {children}
    </BrandPage>
  );
}
