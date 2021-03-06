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

        Stock.findOne({ symbol }, (err, stock) => {
            if (err) return next(err);
            if (stock !== null) {
                return res.status(409).end();
            }

            stockService.getStockMetadata(symbol, (err, data) => {
                if (err) return next(err);

                const name = JSON.parse(data).dataset.name;
                const company = name.substring(0, name.indexOf('(') - 1);

                Stock.create({ company, symbol }, (err, stock) => {
                    if (err) return next(err);
                    res.status(201).json({
                        company: stock.company,
                        symbol: stock.symbol
                    });
                });
            });
        });
    });


router.route('/:symbol')
    .get((req, res, next) => {
        // return stock with given stock symbol from database
        const symbol = req.params.symbol.toUpperCase();

        Stock.findOne({ symbol }, (err, stock) => {
            if (err) return next(err);
            if (stock === null) return res.status(404).end();

            const stockSymbol = stock.symbol;
            const stockCompany = stock.company;

            stockService.getStockData(symbol, (err, data) => {
                if (err) return next(err);
                res.status(200).json({
                    company: stockCompany,
                    symbol: stockSymbol,
                    data: JSON.parse(data).dataset_data.data
                });
            });
        });
    })

    .delete((req, res, next) => {
        // delete a stock from database
        Stock.findOneAndRemove({ symbol: req.params.symbol }, { select: { _id: 0, __v: 0 } }, (err, stock) => {
            if (err) return next(err);
            res.status(200).send(stock);
        });
    });


module.exports = router;