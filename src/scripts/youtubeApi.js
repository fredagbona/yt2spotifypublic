
/**
 * Function to load the GAPI client with the provided API key.
 *
 * @param {string} apiKey - The API key to set for the GAPI client.
 * @return {Promise} A Promise that resolves once the GAPI client is loaded or rejects with an error.
 */
export function loadClient(apiKey) {
    gapi.client.setApiKey(apiKey);
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
      .then(() => console.log("GAPI client loaded for API"), err => console.error("Error loading GAPI client for API", err));
  }

/**
 * Executes the function to retrieve all items from a YouTube playlist.
 *
 * @param {string} playlistId - The ID of the YouTube playlist.
 * @return {Object} An object containing the total results and all items retrieved.
 */
  export async function execute(playlistId) {
    let allItems = [];
    let totalResults = 0;
    let nextPageToken = '';
    do {
      const response = await gapi.client.youtube.playlistItems.list({
        "part": ["id", "contentDetails"],
        "playlistId": playlistId,
        "maxResults": 50,
        "pageToken": nextPageToken
      });
      totalResults = response.result.pageInfo.totalResults;
      allItems = allItems.concat(response.result.items);
      nextPageToken = response.result.nextPageToken;
    } while (nextPageToken);
    return { totalResults, allItems };
  }

/**
 * Fetches video details for a given video ID.
 *
 * @param {string} videoId - The ID of the video to fetch details for.
 * @return {Promise} A Promise that resolves with the details of the video.
 */
  export function fetchVideoDetails(videoId) {
    return gapi.client.youtube.videos.list({
      part: 'snippet,contentDetails,statistics',
      id: videoId
    }).then((response) => {
      return response.result.items[0];
    }).catch((err) => {
      console.error('Execute error', err);
    });
  }

/**
 * Initializes the Gapi client using the provided API key.
 *
 * @param {string} apiKey - The API key to use for initialization.
 * @return {Promise} A Promise that resolves when the client is loaded.
 */
  export function initializeGapiClient(apiKey) {
    return new Promise((resolve) => {
      gapi.load("client", () => {
        loadClient(apiKey).then(() => resolve());
      });
    });
  }
  