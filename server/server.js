const express = require('express');
const mongoose = require('mongoose');
const bodyPaser = require('body-parser');
const session = require('express-session');
const csrf = require('csurf')
const favicon = require('serve-favicon');
const path = require('path');

require('dotenv').config({ path: __dirname + '/config/.env' });
const PORT = parseInt(process.env.PORT, 10);
const DATABASE = process.env.DATABASE;
const SESSION_SECRET = process.env.SESSION_SECRET;

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const MongoStore = require('connect-mongo')(session);
let db;


mongoose.connect(DATABASE);

db = mongoose.connection;
db.on('err', console.error.bind(console, 'Connection error!'));
db.once('open', () => {
    console.log('Connected to database server.');
});


// Set appPath directory according to environment
if (app.get('env') === 'development') {
    app.set('appPath', path.join(__dirname, '../client/app'));
} else {
    app.set('appPath', path.join(__dirname, '../client/dist'));
}

app.use(favicon(path.join(__dirname, 'favicon.ico')));

app.use(express.static(app.get('appPath')));
app.use(express.static(path.join(app.get('appPath'), '../.tmp')));

app.use(session({
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
app.use(bodyPaser.json());
app.use(csrf());


// Routing
app.use((req, res, next) => {
    res.cookie('x-csrf-token', req.csrfToken());
    next();
});

app.get('/', (req, res) => {
    res.sendFile(path.join(app.get('appPath'), '/home.html'));
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