const express = require('express');
const Stock = require('../models/stock');

const router = express.Router();

router.route('/')
	.get((req, res, next) => {
		// return all stocks from database
		Stock.find({}, (err, stocks) => {
			if (err) {
				return next(err);
			}

			res.json(stocks);
		});
	})

	.post((req, res) => {
		// add a stock to database
		Stock.create(req.body, (err, stock) => {
			if (err) return next(err);
			res.json(stock);
		});
	});


router.route('/:stockSymbol')
	.get((req, res, next) => {
		// return stock with given stockSymbol from database
		Stock.findOne({ stockSymbol: req.params.stockSymbol }, (err, stock) => {
			if (err) return next(err);
			res.json(stock);
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