const SPOTIFY_API_BASE_URL = 'https://api.spotify.com/v1';
import axios from 'axios';
import { Buffer } from 'buffer';

const client_id = 'YOUR_SPOTIFY_CLIENT_ID';
const client_secret = 'YOUR_SPOTIFY_CLIENT_SECRETSY';
const REFRESH_TOKEN = 'YOUR_SPOTIFY_REFRESH_TOKEN';

const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
        'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
    }
};

/**
 * Asynchronously fetches an access token using the specified grant type and refresh token.
 *
 * @param {string} grantType - The type of grant being used.
 * @param {string} [refreshToken=''] - The refresh token to be used.
 * @return {string} The access token retrieved from the server response.
 */
async function fetchAccessToken(grantType, refreshToken = '') {
    try {
        const response = await axios.post(authOptions.url, `grant_type=${grantType}&refresh_token=${refreshToken}`, { headers: authOptions.headers });
        return response.data.access_token;
    } catch (error) {
        console.error('Error fetching access token:', error.message);
        throw error;
    }
}

/**
 * Async function to search for a track using the Spotify API.
 *
 * @param {string} query - The search query for the track.
 * @param {string} accessToken - The access token for authorization.
 * @return {string} The ID of the first track found based on the search query.
 */

async function searchTrack(query, accessToken) {
    const encodedQuery = encodeURIComponent(query);
    const url = `${SPOTIFY_API_BASE_URL}/search?q=${encodedQuery}&type=track`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (response.data.tracks.items.length > 0) {
            return response.data.tracks.items[0].id;
        } else {
            throw new Error('No tracks found');
        }
    } catch (error) {
        console.error('Error searching for track:', error.message);
        throw error;
    }
}

/**
 * Retrieves track information by track ID using the Spotify API.
 *
 * @param {string} trackId - The ID of the track to retrieve.
 * @param {string} accessToken - The access token for authorization.
 * @return {Object} The track information returned from the Spotify API.
 */

async function getTrackById(trackId, accessToken) {
    const url = `${SPOTIFY_API_BASE_URL}/tracks/${trackId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching track details:', error.message);
        throw error;
    }
}

async function createPlaylist(userId, playlistDetails, accessToken, retryCount = 0) {
    try {
        const response = await axios.post(
            `https://api.spotify.com/v1/users/${userId}/playlists`,
            playlistDetails,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 429 && retryCount < 3) {
            const retryAfter = error.response.headers['retry-after'] || 1;
            console.warn(`Rate limit exceeded. Retrying after ${retryAfter} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            return createPlaylist(userId, playlistDetails, accessToken, retryCount + 1);
        } else {
            console.error('Error creating playlist:', error);
            throw error;
        }
    }
}

/**
 * Adds a track to a specified playlist on Spotify.
 *
 * @param {string} playlistId - The ID of the playlist to add the track to.
 * @param {string} trackUri - The URI of the track to be added.
 * @param {string} accessToken - The access token for authorization.
 * @param {number} [position=0] - The position in the playlist where the track should be added.
 * @return {Promise} The data of the added track.
 */
async function addTrackToPlaylist(playlistId, trackUri, accessToken, position = 0) {
    const url = `${SPOTIFY_API_BASE_URL}/playlists/${playlistId}/tracks`;

    try {
        const response = await axios.post(url, {
            uris: [`spotify:track:${trackUri}`],
            position: position
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error adding track to playlist:', error.message);
        throw error;
    }
}

/**
 * Add tracks to a playlist in batches.
 *
 * @param {string} playlistId - The ID of the playlist to add tracks to.
 * @param {Array<string>} trackUris - An array of track URIs to add to the playlist.
 * @param {string} accessToken - The access token for authorization.
 * @return {Promise<void>} A Promise that resolves when all tracks are added to the playlist.
 */
async function addTracksToPlaylistInBatch(playlistId, trackUris, accessToken) {
    const url = `${SPOTIFY_API_BASE_URL}/playlists/${playlistId}/tracks`;
    const batchSize = 100;  // Taille maximum de batch acceptée par l'API Spotify

    async function delay(number) {
        return new Promise(resolve => setTimeout(resolve, number));
    }

    for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);  // Crée un sous-tableau de 100 éléments

        try {
            const response = await axios.post(url, {
                uris: batch.map(trackUri => `spotify:track:${trackUri}`),
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Batch added:', response.data);
        } catch (error) {
            console.error('Error adding batch to playlist:', error.message);
            throw error;
        }

        // Add a little delay between batches to avoid hitting the rate limit
        await delay(500);  // 500 ms de délai
    }
}


/**
 * Retrieves the details of a playlist from the Spotify API.
 *
 * @param {string} playlistId - The unique identifier of the playlist.
 * @param {string} accessToken - The access token for authentication.
 * @return {Promise} The data representing the playlist details.
 */
async function getPlaylist(playlistId, accessToken) {
    const url = `${SPOTIFY_API_BASE_URL}/playlists/${playlistId}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching playlist details:', error.message);
        throw error;
    }
}

export { fetchAccessToken as getAccessToken, searchTrack, getTrackById, createPlaylist, addTracksToPlaylistInBatch, addTrackToPlaylist, getPlaylist, fetchAccessToken as getAccessTokenFromRefreshToken };
