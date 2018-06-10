const mongoose = require('mongoose');

const Todo = mongoose.model('Todo', {
    text: {
        type: String, // we can set text a number or boolean and mongoose will cast it to a string ("1" / "true")
        required: true,
        minlength: 1, // "" will fail
        trim: true // remove spaces from the beginning and the end - '      ' will fail
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Number,
        default: null
    }
});

module.exports = { Todo };