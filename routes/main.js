const router = require('express').Router();
const async = require("async");
const stripe = require("stripe")('sk_test_LSiYH30LOsGLpNEgzMZyLaOh');

const User = require("../models/user");
const Product = require("../models/product");
const Cart = require("../models/cart");

paginate = (req, res, next) => {
    const perPage = 9;
    const page = req.params.page;

    Product.find()
        .skip(perPage * page)
        .limit(perPage)
        .populate('category')
        .exec((err, products) => {
            if (err) return next(err);
            Product.countDocuments().exec((err, count) => {
                if (err) return next(err);
                res.render("main/product-main", { products: products, pages: count / perPage });
            });
        });
}

Product.createMapping((err, mapping) => {
    if (err) {
        console.log("error creating Mapping"); console.log(err);
    }
    else {
        console.log("Mapping created"); console.log(mapping);
    }
});

const stream = Product.synchronize();
let count = 0;

stream.on('data', () => count++);
stream.on('close', () => console.log(`Indexed ${count} documents`));
stream.on('error', (err) => console.log(err));

router.get("/cart", (req, res, next) => {
    Cart.findOne({ owner: req.user._id })
        .populate('items.item')
        .exec((err, foundCart) => {
            if (err) return next(err);
            res.render('main/cart', { foundCart: foundCart, message: req.flash('remove') });
        });
});

router.post("/cart", (req, res, next) => {
    Cart.findOne({ owner: req.user._id }, (err, cart) => {
        cart.items.push({
            item: req.body.product_id,
            price: parseFloat(req.body.priceValue),
            quantity: parseInt(req.body.quantity)
        });

        cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2);

        cart.save(err => {
            if (err) return next(err);
            res.redirect("/cart");
        });
    });
});

router.post("/remove", (req, res, next) => {
    Cart.findOne({ owner: req.user._id }, (err, foundCart) => {
        foundCart.items.pull(String(req.body.item));

        foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);
        foundCart.save(err => {
            if (err) return next(err);
            req.flash('remove', "Successfully removed the product");
            res.redirect("/cart");
        });
    });
});

router.post("/search", (req, res) => {
    res.redirect("/search?q=" + req.body.q)
});

router.get("/search", (req, res, next) => {
    if (req.query.q) {
        Product.search({
            query_string: { query: req.query.q }
        }, (err, results) => {
            if (err) return next(err);
            const data = results.hits.hits.map(hit => hit);
            res.render("main/search-result", {
                query: req.query.q,
                data: data
            });
        });
    }
});

router.get("/", (req, res, next) => {
    if (req.user) {
        paginate(req, res, next);
    } else {
        res.render("main/home");
    }
});

router.get("/page/:page", (req, res, next) => {
    paginate(req, res, next);
});

router.get("/about", (req, res) => {
    res.render("main/about");
});

router.get('/products/:id', (req, res, next) => {
    Product.find({ category: req.params.id })
        .populate('category')
        .exec((err, products) => {
            if (err) return next(err);
            res.render('main/category', { products: products })
        });
});

router.get('/product/:id', (req, res, next) => {
    Product.findById({ _id: req.params.id }, (err, product) => {
        if (err) return next(err);
        res.render("main/product", { product: product });
    });
});

router.post("/payment", (req, res, next) => {
    const stripeToken = req.body.stripeToken;
    const currentCharges = Math.round(req.body.stripeMoney * 100);

    stripe.customers.create({ source: stripeToken })
        .then(customer => {
            return stripe.charges.create({
                amount: currentCharges,
                currency: 'usd',
                customer: customer.id
            });
        }).then(charge => {
            async.waterfall([
                callback => {
                    Cart.findOne({ owner: req.user._id }, (err, cart) => {
                        callback(err, cart);
                    })
                },
                (cart, callback) => {
                    User.findOne({ _id: req.user._id }, (err, user) => {
                        if(err){
                            console.log(err);
                        } 
                        else if (user) {
                            for (let i = 0; i < cart.items.length; i++) {
                                user.history.push({
                                    item: cart.items[i].item,
                                    paid: cart.items[i].price
                                });
                            }
                            user.save((err, user) => {
                                if (err) return next(err);
                                callback(err, user);
                            });
                        }
                    });
                },
                user => {
                    Cart.update({ owner: user._id }, { $set: { items: [], total: 0 } }, (err, updated) => {
                        if(err){
                            console.log(err);
                        }
                        else if (updated) {
                            res.redirect("/profile");
                        }
                    });
                }
            ]);
        }).catch(err => {
            console.log(err);
            res.redirect("/cart");
        });
});

module.exports = router;