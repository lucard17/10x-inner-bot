import QuickChart from 'quickchart-js';

export function createChartURL(labels: string[], datasets: { label: string, data: number[], backgroundColor: string, borderColor: string }[]) {
  const chart = new QuickChart();
  chart.setConfig({
    type: 'bar', 
    data: {
      labels,
      datasets: datasets.map(dataset => ({
        ...dataset,
        type: 'bar', 
      }))
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
        },
      },
    },
  });
  return chart.getUrl();
}