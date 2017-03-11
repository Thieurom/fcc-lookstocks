const express = require('express');
const stockService = require('../stockService');
const Stock = require('../../models/stock');

const router = express.Router();

router.route('/')
    .get((req, res, next) => {
        // return all stocks from database
        Stock.find({}, { _id: 0, __v: 0 }, (err, stocks) => {
            if (err) {
                return next(err);
            }

            res.json(stocks);
        });
    })

    .post((req, res, next) => {
        // add a stock to database
        const symbol = req.body.symbol.toUpperCase();

        stockService.getStockMetadata(symbol, (err, data) => {
            if (err) return next(err);

            const name = JSON.parse(data).dataset.name;
            const company = name.substring(0, name.indexOf('(') - 1);

            Stock.create({ company, symbol }, (err, stock) => {
                if (err) return next(err);
                res.json({
                    company: stock.company,
                    symbol: stock.symbol
                });
            });
        });
    });


router.route('/:stockSymbol')
    .get((req, res, next) => {
        // return stock with given stockSymbol from database
        const symbol = req.params.stockSymbol.toUpperCase();

        Stock.findOne({ symbol }, (err, stock) => {
            if (err) return next(err);
            if (stock === null) return res.status(404).end();

            stockService.getStockData(symbol, (err, data) => {
                if (err) return next(err);
                res.status(200).send(data);
            });
        });
    })

    .delete((req, res, next) => {
        // delete a stock from database
        Stock.findOneAndRemove({ stockSymbol: req.params.stockSymbol }, (err, resp) => {
            if (err) return next(err);
            res.end();
        });
    });


module.exports = router;