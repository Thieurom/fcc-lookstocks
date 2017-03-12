'use strict';

const app = {
    stockSymbols: [],
    stockChart: createStockChart(),

    init() {
        // toogle menu
        const menuToggler = document.querySelector('.toggler');

        menuToggler.addEventListener('click', () => {
            const mainEl = document.querySelector('.main');
            mainEl.classList.toggle('show-menu');
        });

        // redraw chart when chart container changes its width when menu toggled
        const chartWrapper = document.querySelector('.chart-wrapper');

        chartWrapper.addEventListener('transitionend', () => {
            window.dispatchEvent(new Event('resize'));
        });

        // handle submit button to add stock
        const form = document.forms[0];
        const formInput = form.input;
        const submitBtn = form.submit;
        const formInfo = form.querySelector('.stock-form__info');

        submitBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const stockSymbol = formInput.value;

            if (!stockSymbol || !this.isAdded(stockSymbol)) {
                this.addStock(stockSymbol);
            }

            // reset form
            formInfo.textContent = '';
            formInput.value = '';
        });
    },

    addStock(stockSymbol) {
        stockService.create(stockSymbol, (err, data) => {
            if (err) return this.handleError(err);

            // get stock data (price history)
            const stock = JSON.parse(data);
            stockService.data(stock.symbol, (err, data) => {
                if (err) return this.handleError(err);

                let stockData = JSON.parse(data).dataset.data.reverse().map(info => {
                    return [
                        (new Date(info[0])).getTime(),
                        info[1]
                    ]
                });

                // update chart with new data
                this.stockChart.addSeries({
                    name: stock.symbol,
                    data: stockData
                });

                // create new stock element and add it to DOM
                const stockTable = document.querySelector('.stock-table');
                const stockElement = new StockElement(stock.company, stock.symbol);

                stockElement.addToContainer(stockTable);

                // store in app
                this.stockSymbols.push(stock.symbol);
            });
        });
    },

    handleError(error) {
        const formInfo = document.querySelector('.stock-form__info');
        formInfo.textContent = error.error;
    },

    isAdded(stockSymbol) {
        return this.stockSymbols.some((s) => {
            return s === stockSymbol.toUpperCase();
        });
    }
};


const stockService = {
    get() {

    },

    create(stockSymbol, done) {
        const data = JSON.stringify({ symbol: stockSymbol });
        this.requestForStock('POST', '/api/stocks', data, done);
    },

    remove(stockSymbol, done) {

    },

    data(stockSymbol, done) {
        this.requestForStock('GET', `/api/stocks/${stockSymbol}`, null, done);
    },

    requestForStock(method, url, data, callback) {
        let xhr = new XMLHttpRequest();

        xhr.open(method, url);
        xhr.setRequestHeader('content-type', 'application/json');
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                    callback(null, xhr.responseText);
                } else if (xhr.status === 404) {
                    callback({ "error": "Symbol not found. Please try again." });
                } else if (xhr.status === 409) {
                    callback({ "error": "Symbol's already added." });
                } else {
                    callback({ "error": "Cannot retreive data. Please try again." });
                }
            }
        };
        xhr.send(data);
    }
}


function StockElement(company, symbol) {
    let stock;

    stock = document.createElement('div');
    stock.className = 'stock';
    stock.innerHTML = `
        <div class="stock__detail"><span class="stock__symbol">${symbol}</span> – <span class="stock__name">${company}</span></div>
        <button class="stock__remove">X</button>
    `.trim();
    stock.querySelector('.stock__remove').addEventListener('click', () => {
        this.removeFromContainer();
    });

    this.element = stock;
    this.container = null;
}

StockElement.prototype.addToContainer = function (container) {
    container.appendChild(this.element);
    this.container = container;
}

StockElement.prototype.removeFromContainer = function () {
    this.container.removeChild(this.element);
}


function createStockChart() {
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


// start the app
app.init();