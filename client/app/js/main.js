'use strict';

const app = {
    /**
     * Chart object
     */
    stockChart: StockChart(),

    stockSocket: new StockSocketService((symbol) => {
        app.getStock(symbol);
    }),


    /**
     * Initialize app: mount all event listeners to interactive elements
     */
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
            this.stockChart.reflow();
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
                this.createStock(stockSymbol);
            }

            // reset form
            formInfo.textContent = '';
            formInput.value = '';
        });
    },


    /**
     * Start the app
     */
    start() {
        this.init();
        this.loadStocks();
    },


    /**
     * Get all stocks data and draw chart on page load
     */
    loadStocks() {
        stockService.get((err, data) => {
            if (err) return this.handleError(err);

            // the latest list of stocks on database
            const stocks = JSON.parse(data);

            // the list of stock symbols's currently on chart
            const chartedStockSymbols = this.stockChart.series.map((series) => {
                return series.name;
            });

            stocks.forEach((stock) => {
                // only get the pricing data of not-charted stock symbols
                if (chartedStockSymbols.indexOf(stock) == -1) {
                    this.getStock(stock.symbol);
                }
            });

            this.stockSocket.start();
        });
    },


    /**
     * Create new stock and get its pricing data, update chart
     */
    createStock(stockSymbol) {
        stockService.create(stockSymbol, (err, data) => {
            if (err) return this.handleError(err);

            // get stock data (price history)
            const stock = JSON.parse(data);
            const stockSymbol = stock.symbol;

            // go ahead to get pricing data
            this.getStock(stockSymbol);

            // inform to server then server can broadcast to other clients about newly-created stock
            this.stockSocket.sendAdditionEvent(stockSymbol);
        });
    },


    /**
     * Remove stock and update chart
     */
    removeStock(stockSymbol) {
        stockService.remove(stockSymbol, (err, data) => {
            if (err) return this.handleError(err);

            const stock = JSON.parse(data);
            for (let i = 0, n = this.stockChart.series.length; i < n; i++) {
                const series = this.stockChart.series[i];
                if (series.name === stock.symbol) {
                    this.stockChart.series[i].remove();
                    return;
                }
            }
        });
    },


    /**
     * Get stock pricing data over time
     */
    getStock(stockSymbol) {
        stockService.data(stockSymbol, (err, data) => {
            if (err) return this.handleError(err);

            const stock = JSON.parse(data);
            let stockData = stock.data.reverse().map(info => {
                return [
                    (new Date(info[0])).getTime(),
                    info[1]
                ]
            });

            // update chart with new data
            this.stockChart.addSeries({
                name: stockSymbol,
                data: stockData
            });

            this.updateStockTable(stock.company, stock.symbol);
        });
    },


    updateStockTable(company, symbol) {
        const stockTable = document.querySelector('.stock-table');
        const stockElement = new StockElement(company, symbol, () => {
            this.removeStock(symbol);
        });

        stockElement.addToContainer(stockTable);
    },


    /**
     * Handle error response from server
     */
    handleError(error) {
        const formInfo = document.querySelector('.stock-form__info');
        formInfo.textContent = error.error;
    },


    /**
     * Check the given stock is already added in chart
     */
    isAdded(stockSymbol) {
        return this.stockChart.series.some((series) => {
            return series.name === stockSymbol.toUpperCase();
        });
    }
};



const stockService = {
    /**
     * Get stock info, include company name and symbol
     */
    get(done) {
        this.requestForStock('GET', '/api/stocks', null, done);
    },


    /**
     * Create new stock
     */
    create(stockSymbol, done) {
        const data = JSON.stringify({ symbol: stockSymbol });
        this.requestForStock('POST', '/api/stocks', data, done);
    },


    /**
     * Remove stock
     */
    remove(stockSymbol, done) {
        this.requestForStock('DELETE', `/api/stocks/${stockSymbol}`, null, done);
    },


    /**
     * Get stock pricing data over time of given stock symbol
     */
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
};



function StockElement(company, symbol, task) {
    let stock;

    stock = document.createElement('div');
    stock.className = 'stock';
    stock.innerHTML = `
        <div class="stock__detail"><span class="stock__symbol">${symbol}</span> – <span class="stock__name">${company}</span></div>
        <button class="stock__remove">X</button>
    `.trim();
    stock.querySelector('.stock__remove').addEventListener('click', () => {
        task();
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



function StockSocketService(addStockHandler, removeStockHandler) {
    this.socket = null;
    this.eventHandlers = {
        addition: addStockHandler,
        removal: removeStockHandler
    };
}

StockSocketService.prototype.start = function() {
    this.socket = io();
    this.socket.on('stock addition', this.eventHandlers['addition']);
    // this.socket.on('stock removal', this.eventHandlers['removal']);
};

StockSocketService.prototype.sendAdditionEvent = function(symbol) {
    this.socket.emit('stock addition', symbol);
};

// StockSocketService.prototype.sendRemovalEvent = function(symbol) {
//     this.socket.emit('stock removal', symbol);
// };



// start the app
app.start();