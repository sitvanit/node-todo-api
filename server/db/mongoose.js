const mongoose = require('mongoose');

mongoose.Promise = global.Promise; // tells mongoose which Promise lib to use, in that case the native.
mongoose.connect(process.env.MONGODB_URI);

module.exports = { mongoose };
