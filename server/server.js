const express = require('express');
const mongoose = require('mongoose');
const bodyPaser = require('body-parser');

require('dotenv').config({ path: __dirname + '/config/.env' });
const PORT = parseInt(process.env.PORT, 10);
const DATABASE = process.env.DATABASE;

const app = express();
const server = require('http').createServer(app);
let db;


mongoose.connect(DATABASE);

db = mongoose.connection;
db.on('err', console.error.bind(console, 'Connection error!'));
db.once('open', () => {
    console.log('Connected to database server.');
});

app.use(bodyPaser.json());
app.use('/api/stocks', require('./routes/api'));

app.use((req, res, next) => {
    let err = new Error('Not found');
    err.status = 404;
    return next(err);
});

app.use((err, req, res, next) => {
    let status = err.status || 500;
    let message = app.get('env') === 'development' ? err.message : {};

    res.status(status).send({ error: message });
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}!`);
});