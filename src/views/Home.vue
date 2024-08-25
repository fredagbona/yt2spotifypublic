<template>
  <div id="searchPart" class="d-flex align-items-center flex-column mt-5 pt-5">
    <h1 class="text-center text-light mb-4">Turn <br>YouTube Playlist to Spotify Playlist</h1><br>
    <form @submit.prevent="convertPlaylist" class="row mb-4">
      <div class="col-12 text-center mb-3">
        <input
            type="url"
            class="form-control-lg me-lg-4 mb-4"
            id="inputPlaylistUrl"
            placeholder="YouTube Playlist URL"
            required
            v-model="youtubeUrl"
        />
        <input
            type="text"
            class="form-control-lg"
            id="inputPlaylistName"
            placeholder="Playlist Name"
            required
            v-model="playlistName"
        />
      </div>
      <div v-if="errorMessage" class="col-12 text-center  text-light">
        <p>{{ errorMessage }}</p>
      </div>
      <div class="col-12 text-center mt-4">
        <button
            v-if="!isLoading"
            type="submit"
            class="btn btn-lg btn-success convertBtn mb-3"
        >
          Convert to Spotify Playlist
        </button>
        <div v-else>
          <button class="btn btn-lg btn-success" type="button" disabled>
            <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            <span role="status">Conversion in progress, it can last a while ...</span>
          </button>
        </div>
      </div>
    </form> <br>
    <div v-if="spotifyUrl" class="mt-3 text-center">
      <h2 class="text-light mb-3">Your Playlist is ready </h2>
      <a :href="spotifyUrl" target="_blank" class="btn btn-lg btn-success text-light">Open your Spotify Playlist here</a>
    </div>
  </div>
</template>



<script>
  import { initializeGapiClient, fetchVideoDetails, execute } from '../scripts/youtubeApi';
  import { getAccessToken, searchTrack, createPlaylist, addTrackToPlaylist, addTracksToPlaylistInBatch, getPlaylist } from '../scripts/spotifyApi';

  export default {
    data() {
      return {
        youtubeUrl: '',
        youtubePlaylistId: '',
        playlistName: '',
        apiKey: 'YOUR_YOUTUBE_API_KEY',
        userId: 'YOUR_SPOTIFY_USER_ID',
        simpleAccessToken: '',
        advancedAccessToken: '',
        youtubeVideos: [],
        spotifyUrl: null,
        totalResults: 0,
        allItems: [],
        videoInfos: [],
        isLoading: false,
        spotifyPlaylistId: null,
        errorMessage: ''
      };
    },
    methods: {
      async convertPlaylist() {
        try {
          this.isLoading = true;
          this.errorMessage = ''; // Réinitialiser le message d'erreur

          // Extract the playlist ID from the URL
          const { playlistId, isValid, message } = this.extractPlaylistId(this.youtubeUrl);

          if (!isValid) {
            this.errorMessage = message;
            this.isLoading = false;
            return;
          }

          this.youtubePlaylistId = playlistId;

          // Recuperate the access token
          const [simpleAccessToken, advancedAccessToken] = await Promise.all([
            getAccessToken('client_credentials'),
            getAccessToken('refresh_token', 'AQCbmiVcMpQ8qjsVKdN7tflwDNgC26LqcvSs5UY3JyQfzVWMlPrnrz9XV6YBybzeUXU2w_wha7kUqjeyQXknjU0FKKXpwDDX4YZGLu1GUkb-0_q3B6LI8erub5ieHALZr6M')
          ]);

          this.simpleAccessToken = simpleAccessToken;
          this.advancedAccessToken = advancedAccessToken;

          // Initialize Google API Client
          await initializeGapiClient(this.apiKey);

          // Recuperate the playlist details
          const { totalResults, allItems } = await execute(playlistId);
          this.totalResults = totalResults;
          this.allItems = allItems;
          let trackIds = [];

          try {
            // Fetch video details and search tracks in parallel
            const videoDetailsPromises = this.allItems.map(async (item) => {
              const videoId = item.contentDetails.videoId;
              const videoDetails = await fetchVideoDetails(videoId);
              if (videoDetails && videoDetails.snippet) {
                const trackData = searchTrack(videoDetails.snippet.title, this.simpleAccessToken);
                return trackData; // Return track data directly
              } else {
                console.warn("Video details not found or snippet missing for videoId:" + videoId);
                return null; // Return null if details or track not found
              }
            });

            // Wait for all video details and track searches to complete
            trackIds = (await Promise.all(videoDetailsPromises)).filter(trackData => trackData !== null);

            // Now trackIds contain all the valid track IDs
          } catch (error) {
            console.error('Error processing playlist:', error);
          }

          const playlistDetails = {
            "name": this.playlistName,
            "description": `${this.playlistName} - ${new Date().toLocaleDateString()}`,
            "public": true
          };

          // Create new playlist
          try {
            const playlistResponse = await createPlaylist(this.userId, playlistDetails, this.advancedAccessToken);
            this.spotifyPlaylistId = playlistResponse.id;

            // Add tracks to playlist in batches
            await addTracksToPlaylistInBatch(this.spotifyPlaylistId, trackIds, this.advancedAccessToken);
          } catch (error) {
            console.error('Error creating playlist or adding tracks:', error);
          }
          // Recuperate the playlist URL
          const playlist = await getPlaylist(this.spotifyPlaylistId, this.advancedAccessToken);
          this.spotifyUrl = playlist.external_urls.spotify;

        } catch (error) {
          console.error('Error converting playlist:', error);
          this.errorMessage = 'Une erreur est survenue lors de la conversion de la playlist.';
        } finally {
          this.isLoading = false;
        }
      }
      ,
      extractPlaylistId(url) {
        try {
          // Create a new URL object from the input URL
          const parsedUrl = new URL(url);

          // Search for the 'list' parameter
          const playlistId = parsedUrl.searchParams.get('list');

          // If the 'list' parameter is found, return the playlist ID
          if (playlistId) {
            return {
              playlistId: playlistId,
              isValid: true
            };
          } else {
            // If the 'list' parameter is not found, return an error message
            return {
              playlistId: null,
              isValid: false,
              message: 'Le lien fourni ne correspond pas à une playlist valide.'
            };
          }
        } catch (error) {
          console.error('Error converting playlist:', error);
          this.error = 'An error occurred during conversion. Please try again later.';
          return {
            playlistId: null,
            isValid: false,
            message: 'URL non valide. Veuillez fournir un lien YouTube valide.'
          };
        }
      },
      async mounted() {
        await initializeGapiClient(this.apiKey);
      }
    }
  };
  </script>
  
  <style>
  .convertBtn{



  }
  </style>
  