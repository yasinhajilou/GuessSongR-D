const axios = require('axios');
const dotenv = require('dotenv');
const findPreview = require('spotify-preview-finder');

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
      const tracksFromSpotify = response.data.tracks;
      if (tracksFromSpotify && tracksFromSpotify.length > 0) {
        const processedTracks = await Promise.all(tracksFromSpotify.map(async (track) => {
          if (!track.preview_url) {
            try {
              const query = `${track.artists.map(a => a.name).join(', ')} - ${track.name}`;
              console.log(`[DIAGNOSTIC] spotifyClient.js - Attempting to find preview for: ${query}`);
              const previewUrl = await findPreview(query);
              if (previewUrl) {
                console.log(`[DIAGNOSTIC] spotifyClient.js - Object received from findPreview for ${query}:`);
                console.log(JSON.stringify(previewUrl, null, 2)); // Log the full object structure

                // For now, to prevent errors with assigning an object to a URL,
                // let's temporarily only assign if it's a string, or assign a known non-playable string.
                // This is so the app doesn't break entirely due to type mismatch in the audio tag's src.
                if (typeof previewUrl === 'string') {
                  track.preview_url = previewUrl;
                } else {
                  // track.preview_url = "is_object_check_logs"; // Or keep it null
                  console.log(`[DIAGNOSTIC] spotifyClient.js - findPreview returned an object, not assigning to track.preview_url yet.`);
                }
              } else {
                console.log(`[DIAGNOSTIC] spotifyClient.js - No preview found by finder for: ${query}`);
              }
            } catch (error) {
              console.error(`[ERROR] spotifyClient.js - Error using spotify-preview-finder for track "${track.name}":`, error.message);
              // Keep track.preview_url as null
            }
          }
          return track; // Return the track, modified or not
        }));
        return processedTracks; // Return the array of processed tracks
      } else {
        return []; // Return empty array if Spotify API returned no tracks
      }
    } else {
      console.warn(`No tracks found for artist ID: ${artistId}`);
      return []; // Return empty array if tracks are not present in the response
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
