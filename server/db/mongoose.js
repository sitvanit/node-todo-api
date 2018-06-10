const mongoose = require('mongoose');

mongoose.Promise = global.Promise; // tells mongoose which Promise lib to use, in that case the native.
mongoose.connect('mongodb://localhost:27017/TodoApp');

module.exports = { mongoose };