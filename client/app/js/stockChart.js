'use strict';

function StockChart() {
    return Highcharts.stockChart('stock-chart', {
        colors: [
            '#6E2594', '#ECD444', '#256EFF', '#26547C', '#FE7F2D',
            '#6622CC', '#CEEC97', '#F4B393', '#E06C9F', '#51E5FF'
        ],

        rangeSelector: {
            buttons: [{
                type: 'week',
                count: 1,
                text: '1W'
            }, {
                type: 'month',
                count: 1,
                text: '1M'
            }, {
                type: 'month',
                count: 3,
                text: '3M'
            }, {
                type: 'month',
                count: 6,
                text: '6M'
            }, {
                type: 'year',
                count: 1,
                text: '1Y'
            }, {
                type: 'year',
                count: 2,
                text: '2Y'
            }],

            buttonTheme: { // styles for the buttons
                fill: 'none',
                stroke: 'none',
                'stroke-width': 0,
                style: {
                    color: '#9B9B9B'
                },
                states: {
                    hover: {},
                    select: {
                        fill: '#2FCB98',
                        style: {
                            color: 'white',
                            font: 'bold'
                        }
                    }
                }
            },

            selected: 4,
            inputEnabled: false
        },

        yAxis: {
            labels: {
                formatter: function () {
                    return (this.value > 0 ? ' + ' : '') + this.value + '%';
                }
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: 'silver'
            }]
        },

        plotOptions: {
            series: {
                compare: 'percent',
                showInNavigator: true
            },

            line: {
                lineWidth: 1
            }
        },

        tooltip: {
            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>',
            valueDecimals: 2,
            split: true
        },

        navigation: {
            buttonOptions: {
                enabled: false
            }
        },

        navigator: {
            enabled: false
        },

        scrollbar: {
            enabled: false
        },

        xAxis: {
            gridLineWidth: 1
        },

        series: []
    });
}