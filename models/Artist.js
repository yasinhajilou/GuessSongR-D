const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  spotify_id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const Artist = mongoose.model('Artist', artistSchema);

module.exports = Artist;
