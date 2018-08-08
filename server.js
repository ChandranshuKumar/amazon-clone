const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("express-flash");
const MongoStore = require("connect-mongo")(session);
const passport = require("passport");

const User = require("./models/user");
const secret = require('./config/secret');

const app = express();

const dbURL = secret.database;
mongoose.connect(dbURL, { useNewUrlParser: true }, (err) => {
    if (err) return console.log(err);
    else return console.log(`Connected to Database`);
});

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: secret.secretKey,
    store: new MongoStore({ url: secret.database, autoReconnect: true})
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.set("view engine", "ejs");
app.use(function(req, res, next){
    res.locals.user = req.user;
    next();
});

const mainRoutes = require("./routes/main");
const userRoutes = require("./routes/user");
app.use(mainRoutes);
app.use(userRoutes);

const port = process.env.PORT || 3000;
app.listen(port, (err) => {
    if (err) throw err;
    console.log(`Server started on port ${port}`);
});