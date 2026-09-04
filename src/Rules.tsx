import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppTheme from './theme/AppTheme';
import DocPage, { DocSection, DocText, DocCardGrid, DocCard, DocTab } from './components/brand/DocPage';
import DocTable, { Pill } from './components/brand/DocTable';
import { brandColors } from './theme/brand';

export const RULES_TABS: DocTab[] = [
  { label: 'Класична мафія', to: '/rules' },
  { label: 'Як рахуються бали', to: '/scoring' },
];

const ROLE_COLUMNS = 'minmax(0,1.1fr) 120px minmax(0,1.6fr)';

export default function Rules(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <DocPage title="Класична мафія" tabs={RULES_TABS} activeTo="/rules">
        <DocSection index={1} title="Що таке Мафія">
          <DocText>
            <strong>Мафія</strong> — це командна психологічна гра, де учасники розділені на дві
            команди: <strong>мирні жителі</strong> та <strong>мафія</strong>. Гравці не знають ролей
            один одного (окрім мафії, яка знає своїх). Гра ведеться ведучим (суддею).
          </DocText>
          <DocText>
            У класичній грі беруть участь <strong>10 гравців</strong>: 6 мирних (включно з Шерифом)
            та 3 мафії (включно з Доном).
          </DocText>
        </DocSection>

        <DocSection index={2} title="Ролі">
          <DocTable
            columns={ROLE_COLUMNS}
            headers={['РОЛЬ', 'КОМАНДА', 'ЗДІБНІСТЬ']}
            rows={[
              ['Мирний житель (×6)', <Pill tone="light">Мирні</Pill>, 'Голосує вдень за вилучення підозрюваних'],
              ['Шериф (×1)', <Pill tone="light">Мирні</Pill>, 'Вночі перевіряє одного гравця — мафія чи ні'],
              ['Мафія (×2)', <Pill tone="accent">Мафія</Pill>, 'Щоночі «вбиває» одного мирного'],
              ['Дон (×1)', <Pill tone="accent">Мафія</Pill>, 'Вночі шукає Шерифа серед гравців'],
            ]}
          />
        </DocSection>

        <DocSection index={3} title="Фази гри">
          <DocCardGrid>
            <DocCard label="ДЕНЬ" labelColor={brandColors.ember}>
              Кожен гравець по черзі висловлюється за 1 хвилину — хто, на його думку, є мафією. Під
              час своєї промови гравець може висунути кандидата на вилучення. Після обговорення —
              голосування.
            </DocCard>
            <DocCard label="ГОЛОСУВАННЯ" labelColor={brandColors.band}>
              Кожен голосує за одного з кандидатів. Якщо не проголосувати, то вважається, що він
              голосує в останню виставлену кандидатуру. Хто набрав більше голосів — вилучається з
              гри. При рівності — додатковий раунд промов серед кандидатів.
            </DocCard>
            <DocCard label="НІЧ" labelColor={brandColors.accentHover}>
              Місто засинає. Мафія із закритими очима має одночасно зробити постріл в одного з
              гравців — якщо всі гравці мафії влучили в одного гравця, він вважається «вбитим».
              Потім прокидається Дон і шукає Шерифа. Далі Шериф перевіряє одного гравця. Вранці
              ведучий оголошує хто був убитий.
            </DocCard>
          </DocCardGrid>
        </DocSection>

        <DocSection index={4} title="Перша ніч">
          <DocText>
            У першу ніч мафія знайомиться між собою та жестами обирає стратегію на гру.
          </DocText>
        </DocSection>

        <DocSection index={5} title="Опорна п'ятірка">
          <DocText>
            Перший вбитий гравець у грі має право на <strong>«Опорну п'ятірку»</strong> — назвати до
            5 гравців, вказавши чорний (мафія) або червоний (мирний) колір.
          </DocText>
        </DocSection>

        <DocSection index={6} title="Попередження (фоли)">
          <DocText>
            Ведучий може видати попередження за порушення правил: розмови поза своєю хвилиною,
            надмірна жестикуляція, грубість тощо.
          </DocText>
          <DocTable
            columns="minmax(0,1fr) 160px"
            headers={['ПОРУШЕННЯ', 'НАСЛІДОК']}
            align={['left', 'right']}
            rows={[
              ['3 попередження', <Pill tone="neutral">пропуск промови</Pill>],
              ['4 попередження', <Pill tone="negative">-0.3 і вилучення</Pill>],
            ]}
          />
        </DocSection>

        <DocSection index={7} title="Умови перемоги">
          <DocCardGrid>
            <DocCard title="Мирні" filled={false} borderColor="rgba(255,255,255,0.14)">
              <Box component="span">Вилучено всю мафію разом з Доном.</Box>
            </DocCard>
            <DocCard
              title="Мафія"
              labelColor={brandColors.accentHover}
              filled={false}
              borderColor="rgba(250,43,30,0.4)"
            >
              <Box component="span">
                Кількість мафії дорівнює кількості мирних, що залишились.
              </Box>
            </DocCard>
          </DocCardGrid>
        </DocSection>
      </DocPage>
    </AppTheme>
  );
}
