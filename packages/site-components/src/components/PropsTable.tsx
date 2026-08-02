import styles from "./PropsTable.module.css";

export interface PropRow {
  name: string;
  type: string;
  defaultValue?: string;
  description?: string;
}

export interface PropsTableProps {
  rows: PropRow[];
}

export function PropsTable({ rows }: PropsTableProps) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col">Prop</th>
          <th scope="col">Type</th>
          <th scope="col">Default</th>
          <th scope="col">Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <th scope="row">
              <code>{row.name}</code>
            </th>
            <td>
              <code>{row.type}</code>
            </td>
            <td className={row.defaultValue ? undefined : styles.default}>
              {row.defaultValue ? <code>{row.defaultValue}</code> : "—"}
            </td>
            <td>{row.description ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
