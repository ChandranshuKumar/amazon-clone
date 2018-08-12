const router = require("express").Router();
const async = require("async");
const faker = require("faker");

const Category = require("../models/category");
const Product = require("../models/product");

router.get("/:name", (req, res, next) => {
    async.waterfall([
        (callback) => {
            Category.findOne({name: req.params.name}, (err, category) => {
                if(err) return next(err);
                callback(null, category);
            });
        },
        (category, callback) => {
            for(let i=0; i<20; i++){
                const product = new Product();
                product.category = category._id;
                product.name = faker.commerce.productName();
                product.price = faker.commerce.price();
                product.image = faker.random.image();

                product.save();
            }
        }
    ]);
    res.json({message: 'Success'});
});

module.exports = router;