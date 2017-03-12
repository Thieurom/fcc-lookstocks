const request = require('request');

const QUANDL_BASE_URL = 'https://www.quandl.com/api/v3/datasets/WIKI';
const QUANDL_API_KEY = process.env.QUANDL_API_KEY;


/**
 * Get stock metadata.
 * Metadata of given symbol, contain company name and symbol
 */
exports.getStockMetadata = (stockSymbol, done) => {
    const url = QUANDL_BASE_URL + '/' + stockSymbol + '/metadata.json' + '?api_key=' + QUANDL_API_KEY;

    request(url, (err, resp, body) => {
        if (err) return done(err);
        if (resp && resp.statusCode >= 400) {
            let err = new Error();
            err.status = resp.statusCode;
            return done(err);
        }
        if (body) done(null, body);
    });
};


/**
 * Get stock data.
 * Data contains daily close-price of 1 year from query time.
 */
exports.getStockData = (stockSymbol, done) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();

    const startDate = (year - 2) + '-' + month + '-' + date;
    const endDate = year + '-' + month + '-' + date;

    const url = QUANDL_BASE_URL + '/' + stockSymbol + '.json?column_index=4' + '&api_key=' + QUANDL_API_KEY + '&start_date=' + startDate + '&end_date=' + endDate;

    request(url, (err, resp, body) => {
        if (err) return done(err);
        if (resp && resp.statusCode >=400) {
            let err = new Error();
            err.status = resp.statusCode;
            return done(err);
        }
        if (body) done(null, body);
    });
};