const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

// Export the rows currently shown in a table as a CSV download.
export const exportCsv = (filename, rows, columns) => {
  const lines = [
    columns.map((column) => cell(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => cell(column.value(row))).join(",")),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
