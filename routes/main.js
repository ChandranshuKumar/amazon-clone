const router = require('express').Router();

const User = require("../models/user");
const Product = require("../models/product");

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
        console.log("error creating Mapping");
        console.log(err);
    }
    else {
        console.log("Mapping created");
        console.log(mapping);
    }
});

const stream = Product.synchronize();
let count = 0;

stream.on('data', () => count++);
stream.on('close', () => console.log(`Indexed ${count} documents`));
stream.on('error', (err) => console.log(err));

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

module.exports = router;