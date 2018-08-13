const router = require('express').Router();
const async = require("async");
const passport = require("passport");

const User = require("../models/user");
const Cart = require("../models/cart");

const passportConfig = require("../config/passport");

router.get("/signup", (req, res) => {
    res.render("accounts/signup", { error: req.flash('error') });
});

router.post("/signup", (req, res, next) => {

    async.waterfall([
        function (callback) {
            const user = new User();
            user.profile.name = req.body.name;
            user.password = req.body.password;
            user.email = req.body.email;
            user.profile.picture = user.gravatar();

            User.findOne({ email: req.body.email }, (err, existingUser) => {
                if (existingUser) {
                    req.flash('error', 'Account with email address already exists');
                    return res.redirect("/signup");
                }
                else {
                    user.save((err, user) => {
                        if (err) return next(err);
                        callback(null, user);
                    });
                }
            });
        },
        function(user){
            const cart = new Cart();
            cart.owner = user._id;
            cart.save(err => {
                if(err) return next(err);
                req.logIn(user, err => {
                    if(err) return next(err);
                    res.redirect("/");
                });
            });
        }
    ]);
});

router.get("/login", (req, res) => {
    if (req.user) return res.redirect("/");
    res.render("accounts/login", { message: req.flash('loginMessage') });
});

router.post("/login", passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => { });

router.get("/profile", (req, res, next) => {
    User.findOne({ _id: req.user._id }, (err, user) => {
        if (err) return next(err);
        res.render("accounts/profile", { user: user });
    });
});

router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

router.get("/edit-profile", (req, res) => {
    res.render("accounts/edit-profile", { message: req.flash('success') });
});

router.post("/edit-profile", (req, res, next) => {
    User.findOne({ _id: req.user._id }, (err, user) => {
        if (err) return next(err);

        if (req.body.name) user.profile.name = req.body.name;
        if (req.body.address) user.address = req.body.address;

        user.save(err => {
            if (err) return next(err);
            req.flash('success', 'Successfully Edited your profile');
            return res.redirect("/profile");
        })
    })
})

module.exports = router;