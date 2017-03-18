'use strict';

function StockElement(company, symbol, task) {
    let stockElement;

    stockElement = document.createElement('div');
    stockElement.className = 'stock';
    stockElement.setAttribute('data-symbol', symbol.toLowerCase());
    stockElement.innerHTML = `
        <div class="stock__detail"><span class="stock__symbol">${symbol}</span> – <span class="stock__name">${company}</span></div>
        <button class="stock__remove">X</button>
    `.trim();
     stockElement.querySelector('.stock__remove').addEventListener('click', () => {
        task();
    });

    return stockElement;
}