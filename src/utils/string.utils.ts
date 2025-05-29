/**
 * Formats a report title, e.g., '#Balandina_10X'.
 * @param {string} input - Raw title input.
 * @returns {string} Formatted report title.
 */
export function getFormatReportTitle(input: string): string {
  const cleanedInput = input.replace(/[^\w\s|]/g, '');
  if (cleanedInput.includes('|')) {
    const name = cleanedInput.split('|')[0].trim() + '_';
    return `#${name.replace(/\s+/g, '_')}10X`;
  }
  return `#${cleanedInput.trim()}`;
}

/**
 * Formats an error message for logging.
 * @param {any} error - Error object or message.
 * @param {string} context - Context message for the error.
 */
export function formatError(error: any, context: string): void {
  const errorMessage = error?.response?.body?.description || (error as Error).message || 'Unknown error';
  console.error(`${context} - ${errorMessage.substring(0, 200)}`);
}

/**
 * Generates a formatted report message from sheet data.
 * @param {any[]} sheetData - Data from the spreadsheet.
 * @returns {string} Formatted report message.
 */
export function getReportMessage(sheetData: any[]): string {
  const tops = sheetData.slice(30);
  const topsRows = tops
    .filter(top => top[1])
    .map(top => `${top[1]}${top[2]}${formatNumberValue(top[3])}\n`)
    .join('');

  return `
<b>${sheetData[12][1]}</b>

<b>${sheetData[14][1]}</b>
<b>${sheetData[15][1]}</b>
${formatNumberValue(sheetData[16][1])} ${sheetData[16][2]} ${formatNumberValue(sheetData[16][3])} ${sheetData[16][4]}
<b>${sheetData[17][1]}</b>
${formatNumberValue(sheetData[18][1])} ${sheetData[18][2]} ${formatNumberValue(sheetData[18][3])} ${sheetData[18][4]}
<b>${sheetData[19][1]}</b>
${formatNumberValue(sheetData[20][1])} ${sheetData[20][2]} ${formatNumberValue(sheetData[20][3])} ${sheetData[20][4]}

<b>${sheetData[22][1]}</b>
${formatNumberValue(sheetData[23][1])} ${sheetData[23][2]} ${formatNumberValue(sheetData[23][3])} ${sheetData[23][4]}

<b>${sheetData[25][1]}</b> ${sheetData[25][2]}
<b>${sheetData[26][1]}</b> ${sheetData[26][2]}
<b>${sheetData[27][1]}</b> ${sheetData[27][2]}

<b>${sheetData[29][1]}</b>
${topsRows}
`;
}

/**
 * Formats a number with thousands separator and optional currency symbol.
 * @param {number | string} number - Number to format.
 * @param {boolean} withRub - Include ruble symbol.
 * @param {boolean} rubInEnd - Place ruble symbol at the end.
 * @returns {string} Formatted number string.
 */
export function formatNumberValue(number: number | string, withRub: boolean = true, rubInEnd: boolean = true): string {
  const validNumber = isNaN(+number) ? 0 : +number;
  const str = withRub ? 'р.' : '';
  return rubInEnd
    ? `${formatThousands(Number(validNumber.toFixed(0)))}${str}`
    : `${str}${formatThousands(Number(validNumber.toFixed(0)))}`;
}

/**
 * Formats a number with thousands separator.
 * @param {number} number - Number to format.
 * @returns {string} Formatted number string.
 */
export function formatThousands(number: number): string {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';
}

/**
 * Formats a number as a percentage.
 * @param {number} number - Number to format.
 * @param {number} fix - Decimal places.
 * @returns {string} Formatted percentage string.
 */
export function formatPercent(number: number, fix: number = 0): string {
  const validNumber = isNaN(number) ? 0 : number;
  return `${(validNumber * 100).toFixed(fix)}%`;
}