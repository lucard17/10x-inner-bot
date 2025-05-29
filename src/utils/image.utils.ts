import nodeHtmlToImage from "node-html-to-image";
import { formatNumberValue, formatPercent } from "./string.utils";

export async function getImageForReport(sheetData: any[]): Promise<Buffer | null> {
  const data = sheetData;

  const ordersData = data[3][11]?.split(';') || []
  const redemptionsData = data[4][11]?.split(';') || []
  const drrData = data[5][11]?.split(';').map((el: string) => el.replace(',', '.')) || []
  const profitData = data[6][11]?.split(';').map((el: string) => el.replace(',', '.')) || []

  try {
    const html = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        ${css}
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th class="table_header"></th>
              <th class="table_header">План</th>
              <th colspan="2" class="table_header">Прогноз мес.</th>
              <th class="table_header">Факт мес.</th>
              <th class="table_header">Графики 30Д</th>
              <th class="table_header">Дин. Нед.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowspan="2" class="blue">Заказы</td>
              <td class="bg-grey">${formatNumberValue(data[2][2], true, false)}</td>
              <td class="bg-grey">${formatNumberValue(data[2][3], true, false)}</td>
              <td class="bg-grey"><span class="percentage ${getColorClass(data[2][4])}">${formatPercent(data[2][4])}</span></td>
              <td class="bg-grey">${formatNumberValue(data[2][5], true, false)}</td>
              <td rowspan="2" class="chart-td">
                <div class="chart-container">
                  <canvas id="ordersChart"></canvas>
                </div>
              </td>
              <td class="${getSignColorClass(data[2][7])}">${formatNumberValue(data[2][7], false)}</td>
            </tr>
            <tr>
              <td>${formatNumberValue(data[3][2], false)}</td>
              <td>${formatNumberValue(data[3][3], false)}</td>
              <td><span class="percentage ${getColorClass(data[3][4])}">${formatPercent(data[3][4])}</span></td>
              <td>${formatNumberValue(data[3][5], false)}</td>
              <td class="${getSignColorClass(data[3][7])}">${formatNumberValue(data[3][7], false)}</td>
            </tr>
            <tr>
              <td rowspan="2" class="orange">Выкупы</td>
              <td class="bg-grey">${formatNumberValue(data[4][2], true, false)}</td>
              <td class="bg-grey">${formatNumberValue(data[4][3], true, false)}</td>
              <td class="bg-grey"><span class=" ${getColorClass(data[4][4])}">${formatPercent(data[4][4])}</span></td>
              <td class="bg-grey">${formatNumberValue(data[4][5], true, false)}</td>
              <td rowspan="2" class="chart-td">
                <div class="chart-container">
                  <canvas id="redemptionsChart"></canvas>
                </div>
              </td>
              <td class="${getSignColorClass(data[4][7])}">${formatNumberValue(data[4][7], false)}</td>
            </tr>
            <tr>
              <td>${formatNumberValue(data[5][2], false)}</td>
              <td>${formatNumberValue(data[5][3], false)}</td>
              <td><span class=" ${getColorClass(data[5][4])}">${formatPercent(data[5][4])}</span></td>
              <td>${formatNumberValue(data[5][5], false)}</td>
              <td class="${getSignColorClass(data[5][7])}">${formatNumberValue(data[5][7], false)}</td>
            </tr>
            <tr>
              <td rowspan="2" class="red">ДРР</td>
              <td class="bg-grey">${formatNumberValue(data[6][2], true, false)}</td>
              <td class="bg-grey">${formatNumberValue(data[6][3], true, false)}</td>
              <td class="bg-grey"><span class=" ${getInverseColorClass(data[6][4])}">${formatPercent(data[6][4])}</span></td>
              <td class="bg-grey">${formatNumberValue(data[6][5], true, false)}</td>
              <td rowspan="2" class="chart-td">
                <div class="chart-container">
                  <canvas id="drrChart"></canvas>
                </div>
              </td>
              <td class="${getSignColorClass(data[6][7])}">${formatNumberValue(data[6][7], false)}</td>
            </tr>
            <tr>
              <td>${formatPercent(data[7][2], 2)}</td>
              <td>${formatPercent(data[7][3], 2)}</td>
              <td class="${getInverseColorClass(data[7][4])}">${formatPercent(data[7][4])}</td>
              <td>${formatPercent(data[7][5], 2)}</td>
              <td class="${getSignColorClass(data[7][7])}">${formatPercent(data[7][7], 2)}</td>
            </tr>
            <tr class="lr">
              <td class="green">Прибыль</td>
              <td>${formatNumberValue(data[8][2], true, false)}</td>
              <td>${formatNumberValue(data[8][3], true, false)}</td>
              <td><span class="percentage ${getColorClass(data[8][4])}">${formatPercent(data[8][4])}</span></td>
              <td>${formatNumberValue(data[8][5], true, false)}</td>
              <td rowspan="2" class="chart-td">
                <div class="chart-container">
                  <canvas id="profitChart"></canvas>
                </div>
              </td>
              <td class="${getSignColorClass(data[8][7])}">${formatNumberValue(data[8][7], false)}</td>
            </tr>
            <tr></tr>
          </tbody>
        </table>

        <script>
          // Bar chart for Заказы (Blue)
          new Chart(document.getElementById('ordersChart'), {
            type: 'bar',
            data: {
              labels: Array(30).fill(''),
              datasets: [{
                data: ${JSON.stringify(ordersData)},
                backgroundColor: '#0000FF',
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { display: false },
                y: { display: false }
              },
              barPercentage: 0.8,
              categoryPercentage: 0.8
            }
          });

          // Bar chart for Выкупы (Orange)
          new Chart(document.getElementById('redemptionsChart'), {
            type: 'bar',
            data: {
              labels: Array(30).fill(''),
              datasets: [{
                data: ${JSON.stringify(redemptionsData)},
                backgroundColor: '#FFA500',
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { display: false },
                y: { display: false }
              },
              barPercentage: 0.8,
              categoryPercentage: 0.8
            }
          });

          // Line chart for ДРР (Red)
          new Chart(document.getElementById('drrChart'), {
            type: 'line',
            data: {
              labels: Array(30).fill(''),
              datasets: [{
                data: ${JSON.stringify(drrData)},
                borderColor: '#FF0000',
                borderWidth: 1,
                fill: false,
                tension: 0, // Straight line
                pointRadius: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { display: false },
                y: { display: false }
              }
            }
          });

          // Bar chart for Прибыль (Green/Red)
          new Chart(document.getElementById('profitChart'), {
            type: 'bar',
            data: {
              labels: Array(30).fill(''),
              datasets: [{
                data: ${JSON.stringify(profitData)},
                backgroundColor: ${JSON.stringify(profitData)}.map(value => value < 0 ? '#FF0000' : '#008000'),
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              },
              scales: {
                x: { display: false },
                y: { display: false }
              },
              barPercentage: 0.8,
              categoryPercentage: 0.8 
            }
          });
        </script>
      </body>
      </html>
    `;

    const imageBuffer = await nodeHtmlToImage({
      html,
      type: "png",
      encoding: "binary",
      puppeteerArgs: { args: ['--no-sandbox'] }
    }) as Buffer;

    return imageBuffer;
  } catch (error) {
    console.error("Error creating image:", error);
    return null;
  }
}

function getColorClass(value: number): string {
  if (value < 0.7) {
    return "color-red";
  } else if (value >= 0.7 && value < 0.85) {
    return "color-orange";
  } else if (value >= 0.85 && value <= 1) {
    return "color-green";
  } else if (value > 1) {
    return "color-darkgreen";
  }
  return "";
}

function getInverseColorClass(value: number): string {
  if (value > 1) {
    return "color-red";
  } else if (value < 0.7) {
    return "color-red";
  } else if (value >= 0.7 && value < 0.85) {
    return "color-orange";
  } else if (value >= 0.85 && value <= 1) {
    return "color-green";
  } else {
    return "";
  }
}

function getSignColorClass(value: number): string {
  return value > 0 ? "color-green" : value < 0 ? "color-red" : "";
}

const css = `<style>
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 10px;
  }

  .chart-td {
    width: 200px !important;
    padding: 0;
    margin: 0;
  }

  .chart-container {
    width: 98%;
    height: 60px;
    display: inline-block;
    padding: 0;
    margin: 0; 
  }

  canvas {
    padding: 0px; 
    width: 100%;
    max-height: 100%;
    padding: 0;
    margin: 0;
  }
  
  th, td {
    border: 1px solid black;
    padding: 2px;
    text-align: center;
    vertical-align: middle;
  }
    
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }

  th {
    background-color: rgb(255, 255, 255);
  }

  .bg-grey {
    background-color: rgb(248, 241, 241) !important;
  }

  .table_header {
    border: none;
  }

  .blue {
    color: blue;
    font-weight: bold;
  }

  .orange {
    color: orange;
    font-weight: bold;
  }

  .red {
    color: red;
    font-weight: bold;
  }

  .green {
    color: green;
    font-weight: bold;
  }

  .small-text {
    font-size: 12px;
  }

  .positive {
    color: green;
  }

  .negative {
    color: red;
  }

  .lr {
    height: 75px !important;
  }

  .color-red {
    color: red;
  }

  .color-orange {
    color: orange;
  }

  .color-green {
    color: green;
  }

  .color-darkgreen {
    color: darkgreen;
  }
</style>`;