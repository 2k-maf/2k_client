import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AppTheme from './theme/AppTheme';
import DocPage, { DocSection, DocText } from './components/brand/DocPage';
import DocTable, { Pill } from './components/brand/DocTable';
import { RULES_TABS } from './Rules';
import { brandColors, brandFonts } from './theme/brand';

const TWO_COLUMNS = 'minmax(0,1fr) 140px';
const OP5_COLUMNS = 'minmax(0,0.8fr) minmax(0,1fr) 140px';

export default function ScoringRules(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <DocPage title="Як рахуються бали" tabs={RULES_TABS} activeTo="/scoring">
        <DocSection index={1} title="Ролі">
          <DocTable
            columns="140px minmax(0,1fr)"
            headers={['КОМАНДА', 'РОЛІ']}
            rows={[
              [<Pill tone="light">Мирні</Pill>, 'Мирний житель, Шериф'],
              [<Pill tone="accent">Мафія</Pill>, 'Мафія (×2), Дон'],
            ]}
          />
        </DocSection>

        <DocSection index={2} title="Бали за гру">
          <DocTable
            columns={TWO_COLUMNS}
            headers={['РЕЗУЛЬТАТ', 'БАЛИ']}
            align={['left', 'right']}
            rows={[
              ['Перемога вашої команди', <Pill tone="positive">+1.0</Pill>],
              ['Поразка', <Pill tone="neutral">0</Pill>],
              ['Вилучення (4 попередження)', <Pill tone="negative">-0.3</Pill>],
            ]}
          />
        </DocSection>

        <DocSection index={3} title="Опорна п'ятірка (ОП5)">
          <DocText>
            Якщо вас вбили першим в ніч, ви називаєте від 1 до 5 гравців та вказуєте їхній колір —{' '}
            <strong>чорний</strong> (мафія) або <strong>червоний</strong> (мирний).
          </DocText>
          <DocTable
            columns={OP5_COLUMNS}
            headers={['ВАШ ВИБІР', 'ХТО НАСПРАВДІ', 'БАЛИ']}
            align={['left', 'left', 'right']}
            rows={[
              [<Pill tone="light">Чорний</Pill>, 'Мафія / Дон', <Pill tone="positive">+0.2</Pill>],
              [<Pill tone="light">Чорний</Pill>, 'Мирний / Шериф', <Pill tone="negative">-0.2</Pill>],
              [<Pill tone="accent">Червоний</Pill>, 'Мирний / Шериф', <Pill tone="positive">+0.1</Pill>],
              [<Pill tone="accent">Червоний</Pill>, 'Мафія / Дон', <Pill tone="negative">-0.1</Pill>],
            ]}
          />
        </DocSection>

        <DocSection index={4} title="Додаткові бали від судді (ДБ)">
          <DocText>Після гри суддя може нарахувати бонусні бали окремим гравцям.</DocText>
          <DocTable
            columns={TWO_COLUMNS}
            headers={['КОМАНДА ГРАВЦЯ', 'МОЖЛИВІ БОНУСИ']}
            align={['left', 'right']}
            rows={[
              ['Переможці', <Pill tone="positive">+0.3 · +0.4 · +0.5</Pill>],
              ['Програвші', <Pill tone="positive">+0.1 · +0.2 · +0.3</Pill>],
            ]}
          />
        </DocSection>

        <DocSection index={5} title="Рейтинг">
          <Box
            sx={{
              background: brandColors.panel,
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '16px',
              px: 3,
              py: 2.5,
              textAlign: 'center',
            }}
          >
            <Typography
              sx={{
                fontFamily: brandFonts.mono,
                fontWeight: 700,
                fontSize: { xs: 15, md: 18 },
                letterSpacing: '0.02em',
              }}
            >
              Рейтинг = (сума балів ÷ кількість ігор) × 100
            </Typography>
          </Box>
          <DocText>
            Гравець, який перемагає в кожній грі без бонусів, матиме рейтинг <strong>100</strong>.
          </DocText>
          <DocTable
            columns="56px minmax(0,1fr)"
            headers={['№', 'МІСЦЕ В РЕЙТИНГУ']}
            rows={[
              ['1', <>Гравці з <strong>≥ середньої кількості ігор</strong> за сезон завжди вище за тих, хто зіграв менше.</>],
              ['2', 'В межах кожної групи — сортування за рейтингом.'],
              ['3', 'При однаковому рейтингу вище стоїть гравець з більшою кількістю ігор.'],
            ]}
          />
        </DocSection>

        <DocSection index={6} title="Приклади">
          <DocTable
            columns={TWO_COLUMNS}
            headers={['СИТУАЦІЯ', 'БАЛИ']}
            align={['left', 'right']}
            rows={[
              ['Перемогли, без бонусів', <Pill tone="positive">1.0</Pill>],
              ['Перемогли + ОП5: 3× чорних вірно, 2× червоних вірно', <Pill tone="positive">1.8</Pill>],
              ['Програли + ОП5: 2× чорних вірно, 1× червоний невірно', <Pill tone="neutral">0.3</Pill>],
              ['Перемогли, але 4 фоли', <Pill tone="neutral">0.7</Pill>],
              ['Програли + 4 фоли', <Pill tone="negative">-0.3</Pill>],
            ]}
          />
        </DocSection>

        <DocSection index={7} title="Сезон">
          <DocText>
            Рейтинг рахується окремо для кожного сезону. Попередні сезони не впливають на поточний
            рейтинг.
          </DocText>
        </DocSection>
      </DocPage>
    </AppTheme>
  );
}
