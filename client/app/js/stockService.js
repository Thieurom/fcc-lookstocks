'use strict';

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