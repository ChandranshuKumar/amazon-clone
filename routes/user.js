const router = require('express').Router();
const User = require("../models/user");
const passport = require("passport");

var passportConfig = require("../config/passport");

router.get("/signup", (req, res) => {
    res.render("accounts/signup", { error: req.flash('error') });
});

router.post("/signup", (req, res, next) => {
    var user = new User();
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
                req.logIn(user, err => {
                    if (err) return next(err);
                    res.redirect("/profile");
                })
            });
        }
    });
});

router.get("/login", (req, res) => {
    if (req.user) return res.redirect("/");
    res.render("accounts/login", { message: req.flash('loginMessage') });
});

router.post("/login", passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
}), (req, res) => {});

router.get("/profile", (req, res, next) => {
    User.findOne({_id: req.user._id}, (err, user) => {
        if(err) return next(err);
        res.render("accounts/profile", {user: user});
    });
});

router.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

module.exports = router;