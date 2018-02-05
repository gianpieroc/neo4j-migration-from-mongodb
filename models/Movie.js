const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const MovieSchema = new mongoose.Schema({},{ collection: 'Movie' });

module.exports = mongoose.model('Movie', MovieSchema);
