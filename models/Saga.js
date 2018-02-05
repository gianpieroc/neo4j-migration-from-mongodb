const mongoose = require('mongoose');

const SagaSchema = new mongoose.Schema({}, {collection: 'Saga'});

module.exports = mongoose.model('Saga', SagaSchema);
