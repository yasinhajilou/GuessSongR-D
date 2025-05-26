const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config(); // Ensure environment variables are loaded

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let accessToken = null;

// TODO: User must add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to their .env file
if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.warn("SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing from .env file. Please add them.");
  // Depending on the application's needs, you might want to throw an error here
  // or handle this case more gracefully. For now, we'll log a warning.
}

async function getAccessToken() {
  if (accessToken) {
    // TODO: Implement token refresh logic if the token is expired
    // For now, we return the existing token.
    return accessToken;
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Spotify Client ID or Secret is not configured. Please check your .env file.");
  }

  const credentials = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    accessToken = response.data.access_token;
    // TODO: Store token expiration time and implement refresh logic
    console.log('Successfully retrieved Spotify access token.');
    return accessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to retrieve access token from Spotify.');
  }
}

async function searchArtists(query) {
  const token = await getAccessToken();
  if (!token) {
    console.error('Cannot search artists without an access token.');
    // Or throw new Error('Access token not available');
    return null;
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: {
        q: query,
        type: 'artist',
        limit: 20,
      },
    });
    return response.data.artists.items;
  } catch (error) {
    console.error('Error searching artists on Spotify:', error.response ? error.response.data : error.message);
    return null; // Or an empty array []
  }
}

async function getArtistTopTracks(artistId, marketCode) {
  const token = await getAccessToken();
  if (!token) {
    console.error('Cannot fetch top tracks without an access token.');
    // Or throw new Error('Access token not available');
    return null;
  }

  const effectiveMarket = marketCode || process.env.SPOTIFY_MARKET || 'US';

  try {
    const response = await axios.get(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: {
        market: effectiveMarket,
      },
    });

    if (response.data && response.data.tracks) {
      return response.data.tracks;
    } else {
      console.warn(`No tracks found for artist ID: ${artistId}`);
      return []; // Return empty array if tracks are not present
    }
  } catch (error) {
    console.error(`Error fetching top tracks for artist ID ${artistId}:`, error.response ? error.response.data : error.message);
    return null; // Or an empty array []
  }
}

module.exports = {
  getAccessToken,
  searchArtists,
  getArtistTopTracks,
};
