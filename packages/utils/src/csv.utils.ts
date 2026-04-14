export interface CsvParseResult<T> {
  data: T[];
  errors: CsvParseError[];
  skippedRows: number;
}

export interface CsvParseError {
  rowNumber: number;
  reason: string;
  rawData?: string;
}

/**
 * Parse a single CSV row string into an object
 * Handles quoted fields and escaped quotes
 */
export function parseCsvRow(
  row: string,
  headers: string[]
): Record<string, string> {
  const values = parseRawCsvValues(row);

  if (values.length !== headers.length) {
    throw new Error(
      `Row has ${values.length} values but expected ${headers.length}`
    );
  }

  const result: Record<string, string> = {};
  headers.forEach((header, index) => {
    result[header] = values[index].trim();
  });

  return result;
}

/**
 * Validate that CSV headers match expected columns
 */
export function validateCsvHeaders(
  headers: string[],
  requiredHeaders: string[],
  allowExtra: boolean = true
): { valid: boolean; missingHeaders: string[] } {
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

  if (missingHeaders.length > 0) {
    return { valid: false, missingHeaders };
  }

  if (!allowExtra && headers.length > requiredHeaders.length) {
    return { valid: false, missingHeaders: [] };
  }

  return { valid: true, missingHeaders: [] };
}

/**
 * Parse raw CSV values from a row string, handling quotes and escapes
 */
function parseRawCsvValues(row: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/**
 * Split CSV content into rows
 */
export function splitCsvRows(content: string): string[] {
  return content
    .split("\n")
    .map((row) => row.trim())
    .filter((row) => row.length > 0);
}

/**
 * Extract headers from first row of CSV
 */
export function extractCsvHeaders(firstRow: string): string[] {
  return parseRawCsvValues(firstRow).map((h) => h.trim().toLowerCase());
}
