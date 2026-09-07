import * as React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { brandColors, monoSx } from '../../theme/brand';

export type BrandColumn<T> = {
  /** Ключ React і назва поля за замовчуванням. */
  key: string;
  /** Заголовок колонки — моно, великі літери. */
  header: string;
  /** Трек CSS-сітки, напр. 'minmax(0,1fr)' або '120px'. */
  width: string;
  align?: 'left' | 'right';
  /** Вміст комірки. Без нього беремо `row[key]`. */
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: BrandColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string | number;
  /** Рядків на сторінку. 0 вимикає пагінацію. */
  pageSize?: number;
  loading?: boolean;
  /** Текст, коли даних немає. */
  emptyText?: string;
  /** Ширина, нижче якої таблиця скролиться горизонтально. */
  minWidth?: number;
  /** Робить рядок інтерактивним: клік і клавіша Enter викликають обробник. */
  onRowClick?: (row: T) => void;
  /** Підсвічує рядок — напр. рядок поточного гравця в таблиці турніру. */
  highlightRow?: (row: T) => boolean;
};

const HEADER_COLOR = 'rgba(242,243,247,0.45)';
const ROW_BORDER = '1px solid rgba(255,255,255,0.07)';

function StateRow({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ px: 1.5, py: 5, textAlign: 'center', ...monoSx(13, HEADER_COLOR) }}>{children}</Box>
  );
}

/**
 * Таблиця даних у стилі бренду: моно-шапка, сітка рядків, пагінація.
 * Візуально збігається з рейтингом клубу — MUI DataGrid тут не використовуємо,
 * бо його стандартна тема не відповідає макету.
 */
export default function BrandTable<T>({
  columns,
  rows,
  getRowKey,
  pageSize = 15,
  loading = false,
  emptyText = 'Даних поки немає.',
  minWidth = 720,
  onRowClick,
  highlightRow,
}: Props<T>) {
  const [page, setPage] = React.useState(0);

  const gridColumns = columns.map((c) => c.width).join(' ');
  const paginated = pageSize > 0;
  const pageCount = paginated ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  // Дані могли скоротитись після завантаження — тримаємо сторінку в межах.
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = paginated ? rows.slice(safePage * pageSize, safePage * pageSize + pageSize) : rows;
  const firstShown = rows.length === 0 ? 0 : safePage * pageSize + 1;
  const lastShown = safePage * pageSize + pageRows.length;

  return (
    <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.14)', overflowX: 'auto' }}>
      <Box sx={{ minWidth }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: gridColumns,
            gap: 2,
            px: 1.5,
            py: 1.75,
            ...monoSx(11, HEADER_COLOR),
            letterSpacing: '0.14em',
            borderBottom: '1px solid rgba(255,255,255,0.10)',
          }}
        >
          {columns.map((column) => (
            <Box key={column.key} component="span" sx={{ textAlign: column.align ?? 'left' }}>
              {column.header}
            </Box>
          ))}
        </Box>

        {loading && <StateRow>Завантаження…</StateRow>}
        {!loading && rows.length === 0 && <StateRow>{emptyText}</StateRow>}

        {!loading &&
          pageRows.map((row) => (
            <Box
              key={getRowKey(row)}
              // Клавіатура має відкривати рядок так само, як миша.
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onRowClick(row);
                      }
                    }
                  : undefined
              }
              sx={{
                display: 'grid',
                gridTemplateColumns: gridColumns,
                gap: 2,
                alignItems: 'center',
                px: 1.5,
                py: 1.75,
                fontSize: 15,
                borderBottom: ROW_BORDER,
                background: highlightRow?.(row) ? brandColors.panelAlt : 'transparent',
                fontWeight: highlightRow?.(row) ? 700 : 400,
                cursor: onRowClick ? 'pointer' : 'default',
                '&:hover': { background: '#141a2e' },
                '&:focus-visible': {
                  outline: `2px solid ${brandColors.accentHover}`,
                  outlineOffset: '-2px',
                },
              }}
            >
              {columns.map((column) => (
                <Box
                  key={column.key}
                  component="span"
                  sx={{
                    textAlign: column.align ?? 'left',
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {column.render ? column.render(row) : (row as any)[column.key]}
                </Box>
              ))}
            </Box>
          ))}

        {paginated && !loading && rows.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 2.5,
            }}
          >
            <Box component="span" sx={monoSx(12, HEADER_COLOR)}>
              {firstShown}—{lastShown} З {rows.length}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { label: '‹', name: 'Попередня сторінка', disabled: safePage === 0, go: () => setPage(safePage - 1) },
                { label: '›', name: 'Наступна сторінка', disabled: safePage >= pageCount - 1, go: () => setPage(safePage + 1) },
              ].map((btn) => (
                <IconButton
                  key={btn.label}
                  onClick={btn.go}
                  disabled={btn.disabled}
                  aria-label={btn.name}
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: brandColors.text,
                    '&.Mui-disabled': { color: 'rgba(242,243,247,0.25)' },
                  }}
                >
                  {btn.label}
                </IconButton>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
