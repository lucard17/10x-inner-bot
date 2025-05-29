/**
 * return report title: #Balandina_10X
 */
export function getFormatReportTitle(input: string): string { 
  const cleanedInput = input.replace(/[^\w\s|]/g, '');

  if (cleanedInput.includes('|')) {
    const name = cleanedInput.split('|')[0].trim() + "_";; 
    return '#' + name.replace(/\s+/g, '_') + '10X';
  } else {
    return '#' + cleanedInput.trim();  
  }
}

/**
 * formatting error message
 */
export function formatError(error: any, contextMessage: string) {
  const errorMessage = error?.response?.body?.description || (error as Error).message || 'Unknown error';
  console.error(`Error: ${contextMessage} - ${errorMessage.substring(0, 200)}`);
}

export function getReportMessage(sheetData: any[]) {
  const tops = sheetData.slice(30)
  let topsRows = ``;

  tops.forEach(top => {
    topsRows += top[1] ? `${top[1]}${top[2]}${formatNumberValue(top[3])}\n` : ""
  })

  return (
`\n
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
`
  )
}

export const formatNumberValue = (number: number | string, withRub: boolean = true, rubInEnd: boolean = true) => {
  const validNumber = isNaN(+number) ? 0 : +number;
  const str = withRub ? 'р.' : '';
  const res = rubInEnd ? `${formatThousands(Number(validNumber.toFixed(0)))}${str}` : `${str}${formatThousands(Number(validNumber.toFixed(0)))}`
  return res;
}

export const formatThousands = (number: number): string => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';
}

export const formatPercent = (number: number, fix: number = 0): string => {
  const validNumber = isNaN(number) ? 0 : number;
  return (validNumber * 100).toFixed(fix) + '%'
}