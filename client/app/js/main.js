'use strict';

const app = {
    /**
     * Chart object
     */
    stockChart: StockChart(),

    stockSocket: new StockSocketService((symbol) => {
        app.getStock(symbol);
    }, (symbol) => {
        app.removeStock(symbol);
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
        // for best user experience, immediately remove stock from stoock table,
        // and update chart
        const stockElement = document.querySelector('.stock[data-symbol="' + `${stockSymbol.toLowerCase()}` + '"]');
        this.removeStockFromStockTable(stockElement);

        this.removeStockFromChart(stockSymbol);

        // then request updating on server
        stockService.remove(stockSymbol, (err, data) => {
            // for any error occurs, check all stocks on database after 15s
            if (err) {
                setTimeout(() => {
                    this.loadStocks();
                }, 15000);
            }
        });

        // finally, inform to server then server can broadcast to other clients about removed stock
        this.stockSocket.sendRemovalEvent(stockSymbol);
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
            this.addStockToChart(stockSymbol, stockData);

            this.addStockToStockTable(stock.company, stock.symbol);
        });
    },


    addStockToStockTable(company, symbol) {
        const stockTable = document.querySelector('.stock-table');
        const stockElement = StockElement(company, symbol, () => {
            this.removeStock(symbol);
        });

        stockTable.appendChild(stockElement);
    },


    removeStockFromStockTable(stockElement) {
        const stockTable = document.querySelector('.stock-table');
        stockTable.removeChild(stockElement);
    },


    /**
     * Add new stock data for redrawing chart
     */
    addStockToChart(symbol, data) {
        this.stockChart.addSeries({
            name: symbol,
            data: data
        });
    },


    /**
     * Remove a stock data from chart
     */
    removeStockFromChart(symbol) {
        for (let i = 0, n = this.stockChart.series.length; i < n; i++) {
            const series = this.stockChart.series[i];
            if (series.name === symbol) {
                this.stockChart.series[i].remove();
                return;
            }
        }
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



// start the app
app.start();