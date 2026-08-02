/**
 * Parse simple CSV text: comma-separated values, one row per line.
 * Supports optional header row when the first row contains non-numeric cells.
 */
export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: ["Column 1", "Column 2"], rows: [] };
  }

  const rows = lines.map((line) => line.split(",").map((cell) => cell.trim()));
  const firstRowNumeric = rows[0]?.every((cell) => cell !== "" && !Number.isNaN(Number(cell)));

  if (firstRowNumeric || rows.length === 1) {
    const columnCount = Math.max(...rows.map((row) => row.length), 2);
    const headers = Array.from({ length: columnCount }, (_, index) => `Column ${index + 1}`);
    return { headers, rows };
  }

  const headers = rows[0] ?? [];
  return { headers, rows: rows.slice(1) };
}

export function matrixToCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => row.map((cell) => cell.replace(/,/g, "")).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export function resultsToCsv(rows: { metric: string; value: string }[]): string {
  return ["metric,value", ...rows.map((row) => `${row.metric},${row.value}`)].join("\n");
}

export function parseNumericColumns(
  headers: string[],
  rows: string[][],
  columnCount: number,
): { headers: string[]; columns: number[][]; errors: string[] } {
  const normalizedHeaders =
    headers.length >= columnCount
      ? headers.slice(0, columnCount)
      : [
          ...headers,
          ...Array.from({ length: columnCount - headers.length }, (_, index) => {
            return `Column ${headers.length + index + 1}`;
          }),
        ];

  const columns = Array.from({ length: columnCount }, () => [] as number[]);
  const errors: string[] = [];

  rows.forEach((row, rowIndex) => {
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const raw = row[columnIndex]?.trim() ?? "";
      if (raw === "") {
        continue;
      }

      const value = Number(raw);
      if (Number.isNaN(value)) {
        errors.push(`Row ${rowIndex + 1}, ${normalizedHeaders[columnIndex]}: not a number`);
        continue;
      }

      columns[columnIndex]?.push(value);
    }
  });

  return { headers: normalizedHeaders, columns, errors };
}
