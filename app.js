const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log("// TODO: User must create a .env file and add MONGODB_URI=\"your_mongodb_atlas_connection_string\"");
  // You might want to exit the application or provide a default behavior here
  // For now, we'll just log a message.
}

mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/guess-the-song', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const { searchArtists, getArtistTopTracks } = require('./spotifyClient'); // Require searchArtists AND getArtistTopTracks
const Artist = require('./models/Artist'); // Require the Artist model

// Middleware for parsing URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static('public'));

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Define a GET route for '/'
app.get('/', (req, res) => {
  res.render('home', { message: 'Welcome to Guess The Song!' });
});

// Define a GET route for '/artists'
app.get('/artists', async (req, res) => {
  try {
    const artists = await Artist.find({});
    const message = req.query.message; // Get message from query
    res.render('artists-list', { artists, message }); // Pass message to template
  } catch (error) {
    console.error('Error fetching artists:', error);
    res.status(500).send('Error fetching artists');
  }
});

// Define a GET route for '/search-artist'
app.get('/search-artist', async (req, res) => {
  const searchQuery = req.query.query;
  if (!searchQuery) {
    // Optional: Redirect to home or render home with an error message
    return res.render('home', { message: 'Please enter a search query.' });
  }

  try {
    const artists = await searchArtists(searchQuery);
    if (artists) {
      res.render('search-results', { artists, searchQuery });
    } else {
      // Handle case where artists is null (e.g., Spotify API error)
      res.render('search-results', { artists: [], searchQuery, error: 'Could not retrieve artists. Please try again.' });
    }
  } catch (error) {
    console.error('Error in /search-artist route:', error);
    // Render an error page or pass an error message to the template
    res.render('search-results', { artists: [], searchQuery, error: 'An unexpected error occurred.' });
  }
});

// Define a POST route for '/save-artist'
app.post('/save-artist', async (req, res) => {
  const { spotify_id, name } = req.body;

  if (!spotify_id || !name) {
    // For simplicity, sending a 400 error. Could also render an error page.
    return res.status(400).send('Missing spotify_id or name.');
  }

  try {
    const existingArtist = await Artist.findOne({ spotify_id: spotify_id });

    if (existingArtist) {
      console.log(`Artist ${name} (ID: ${spotify_id}) already exists.`);
      return res.redirect('/artists?message=Artist already saved');
    }

    const newArtist = new Artist({ spotify_id, name });
    await newArtist.save();
    console.log(`Artist ${name} (ID: ${spotify_id}) saved successfully.`);
    return res.redirect('/artists?message=Artist saved successfully');

  } catch (error) {
    console.error('Error saving artist:', error);
    // For simplicity, sending a 500 error. Could also render a dedicated error page.
    return res.status(500).send('Error saving artist.');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Define a GET route for '/artist/:spotifyId/tracks'
app.get('/artist/:spotifyId/tracks', async (req, res) => {
  const { spotifyId } = req.params;

  try {
    const artist = await Artist.findOne({ spotify_id: spotifyId });
    if (!artist) {
      // For simplicity, sending 404. Ideally, render a proper error page.
      return res.status(404).send('Artist not found in your saved list.');
    }

    const tracks = await getArtistTopTracks(spotifyId);
    if (!tracks) {
      // Error already logged in spotifyClient, or no token
      // For simplicity, sending 500. Ideally, render a proper error page.
      return res.status(500).send('Could not retrieve top tracks from Spotify.');
    }

    res.render('artist-tracks', {
      artistName: artist.name, // Pass artist's name from DB
      tracks: tracks,
    });

  } catch (error) {
    console.error(`Error fetching tracks for artist ${spotifyId}:`, error);
    // For simplicity, sending 500. Ideally, render a proper error page.
    res.status(500).send('An unexpected error occurred while fetching tracks.');
  }
});
