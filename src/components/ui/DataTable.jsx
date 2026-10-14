import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { cx } from './primitives';
import { EmptyState } from './feedback';

/**
 * columns: [{ key, header, render?(row), sortValue?(row), className?, align? }]
 */
export function DataTable({ columns, rows, pageSize = 10, empty, onRowClick, rowKey = 'id', initialSort, dense }) {
  const [sort, setSort] = useState(initialSort || null);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const getter = col.sortValue || ((r) => r[col.key]);
    return [...rows].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      if (va === vb) return 0;
      if (va === null || va === undefined || va === '') return 1;
      if (vb === null || vb === undefined || vb === '') return -1;
      const res = va > vb ? 1 : -1;
      return sort.dir === 'asc' ? res : -res;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = sorted.slice(current * pageSize, current * pageSize + pageSize);

  if (!rows.length) {
    return empty || <EmptyState title="No records yet" message="Records you add will appear here." />;
  }

  const toggleSort = (key) => {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  };

  return (
    <div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cx('th', c.align === 'right' && 'text-right', dense && 'py-2')}>
                  {c.sortable === false ? (
                    c.header
                  ) : (
                    <button type="button" onClick={() => toggleSort(c.key)} className={cx('inline-flex items-center gap-1 uppercase hover:text-slate-800', c.align === 'right' && 'flex-row-reverse')}>
                      {c.header}
                      {sort?.key === c.key ? (
                        sort.dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {visible.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cx('transition', onRowClick && 'cursor-pointer hover:bg-indigo-50/40')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cx('td', c.align === 'right' && 'text-right', dense && 'py-2', c.className)}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <span>
            {current * pageSize + 1}–{Math.min(sorted.length, (current + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 tabular-nums">
              {current + 1} / {pages}
            </span>
            <button
              type="button"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              className="rounded-lg p-1.5 hover:bg-slate-100 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
