import styles from "./DataTable.module.css";

export interface DataTableProps {
  headers: string[];
  rows: string[][];
  onHeadersChange: (headers: string[]) => void;
  onRowsChange: (rows: string[][]) => void;
}

function ensureRowWidth(row: string[], width: number): string[] {
  const next = [...row];
  while (next.length < width) {
    next.push("");
  }
  return next.slice(0, width);
}

export function DataTable({ headers, rows, onHeadersChange, onRowsChange }: DataTableProps) {
  const columnCount = headers.length;

  const updateCell = (rowIndex: number, columnIndex: number, value: string) => {
    const nextRows = rows.map((row, index) => {
      if (index !== rowIndex) {
        return ensureRowWidth(row, columnCount);
      }
      const nextRow = ensureRowWidth(row, columnCount);
      nextRow[columnIndex] = value;
      return nextRow;
    });
    onRowsChange(nextRows);
  };

  const updateHeader = (columnIndex: number, value: string) => {
    const nextHeaders = [...headers];
    nextHeaders[columnIndex] = value;
    onHeadersChange(nextHeaders);
  };

  const addRow = () => {
    onRowsChange([...rows, Array.from({ length: columnCount }, () => "")]);
  };

  const removeRow = () => {
    if (rows.length <= 1) {
      return;
    }
    onRowsChange(rows.slice(0, -1));
  };

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className={styles.caption}>
          Enter numeric observations in each column. Empty cells are ignored.
        </caption>
        <thead>
          <tr>
            {headers.map((header, columnIndex) => (
              <th key={columnIndex} scope="col">
                <input
                  className={styles.headerInput}
                  aria-label={`Column ${columnIndex + 1} header`}
                  value={header}
                  onChange={(event) => updateHeader(columnIndex, event.target.value)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((_, columnIndex) => (
                <td key={columnIndex}>
                  <input
                    className={styles.cellInput}
                    type="text"
                    inputMode="decimal"
                    aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}`}
                    value={ensureRowWidth(row, columnCount)[columnIndex] ?? ""}
                    onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.rowActions}>
        <button type="button" className={styles.actionButton} onClick={addRow}>
          Add row
        </button>
        <button type="button" className={styles.actionButton} onClick={removeRow}>
          Remove row
        </button>
      </div>
    </div>
  );
}
