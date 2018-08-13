const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("express-flash");
const MongoStore = require("connect-mongo")(session);
const passport = require("passport");

const secret = require('./config/secret');
const User = require("./models/user");
const Category = require("./models/category");

const cartLength = require("./middlewares/middlewares");

const app = express();

mongoose.connect(secret.database, { useNewUrlParser: true }, (err) => {
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
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
app.use((req, res, next) => {
    Category.find({}, (err, categories) => {
        if(err) return next(err);
        res.locals.categories = categories;
        next();
    });
});
app.use(cartLength);

const mainRoutes = require("./routes/main");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const apiRoutes = require("./api/api");
app.use(mainRoutes);
app.use(userRoutes);
app.use(adminRoutes);
app.use("/api", apiRoutes);

const port = process.env.PORT || 3000;
app.listen(port, (err) => {
    if (err) throw err;
    console.log(`Server started on port ${port}`);
});