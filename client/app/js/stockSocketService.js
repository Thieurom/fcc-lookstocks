'use strict';

function StockSocketService(addStockHandler, removeStockHandler) {
    this.socket = null;
    this.eventHandlers = {
        addition: addStockHandler,
        removal: removeStockHandler
    };
}

StockSocketService.prototype.start = function () {
    this.socket = io();
    this.socket.on('stock addition', this.eventHandlers['addition']);
    this.socket.on('stock removal', this.eventHandlers['removal']);
};

StockSocketService.prototype.sendAdditionEvent = function (symbol) {
    this.socket.emit('stock addition', symbol);
};

StockSocketService.prototype.sendRemovalEvent = function(symbol) {
    this.socket.emit('stock removal', symbol);
};