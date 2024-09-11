"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChartURL = createChartURL;
const quickchart_js_1 = __importDefault(require("quickchart-js"));
function createChartURL(labels, datasets) {
    const chart = new quickchart_js_1.default();
    chart.setConfig({
        type: 'bar',
        data: {
            labels,
            datasets: datasets.map(dataset => (Object.assign(Object.assign({}, dataset), { type: 'bar' })))
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
