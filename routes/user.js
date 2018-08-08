const router = require('express').Router();
const User = require("../models/user");

router.get("/signup", (req, res) => {
    res.render("accounts/signup", {error: req.flash('error')});
});

router.post("/signup", (req, res, next) => {
    var user = new User();
    user.profile.name = req.body.name;
    user.password = req.body.password;
    user.email = req.body.email;

    User.findOne({ email: req.body.email }, (err, existingUser) => {
        if (existingUser) {
            req.flash('error', 'Account with email address already exists');
            return res.redirect("/signup");
        }
        else {
            user.save((err, user) => {
                if (err) return next(err);
                return res.redirect("/");
            });
        }
    });
});

module.exports = router;