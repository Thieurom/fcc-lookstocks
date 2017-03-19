const express = require('express');
const mongoose = require('mongoose');
const bodyPaser = require('body-parser');
const session = require('express-session');
const csrf = require('csurf')
const path = require('path');

require('dotenv').config({ path: __dirname + '/config/.env' });
const PORT = parseInt(process.env.PORT, 10);
const DATABASE = process.env.DATABASE;

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
let db;


mongoose.connect(DATABASE);

db = mongoose.connection;
db.on('err', console.error.bind(console, 'Connection error!'));
db.once('open', () => {
    console.log('Connected to database server.');
});


// Config for development
if (app.get('env') === 'development') {
    app.set('appPath', path.join(__dirname, '../client/app'));
} else {
    app.set('appPath', path.join(__dirname, '../client/dist'));
}

app.use('/static', express.static(app.get('appPath')));
app.use('/static', express.static(path.join(app.get('appPath'), '../.tmp')));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyPaser.json());
app.use(csrf());


// Routing
app.use((req, res, next) => {
    res.cookie('x-csrf-token', req.csrfToken());
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(app.get('appPath'), '/index.html'));
});

app.use('/api/stocks', require('./routes/api'));

// Catch 404 error
app.use((req, res, next) => {
    let err = new Error('Not found');
    err.status = 404;
    return next(err);
});

// Error handler
app.use((err, req, res, next) => {
    let status = err.status || 500;
    let message = app.get('env') === 'development' ? err.message : {};

    res.status(status).send({ error: message });
});


io.on('connection', client => {
    console.log('A client connected.');
    client.on('stock addition', symbol => {
        client.broadcast.emit('stock addition', symbol);
    });

    client.on('stock removal', symbol => {
        client.broadcast.emit('stock removal', symbol);
    });
});

// Establish server
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}!`);
});