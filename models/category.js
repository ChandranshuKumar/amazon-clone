const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CategorySchema = new Schema ({
    name: {type: String, unique: true, lowercase: true, es_type: 'text'}
});

module.exports = mongoose.model('Category', CategorySchema);