const BASE_URL = 'https://saavn.sumit.co/api';

export interface Song {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  url: string;
  duration: number;
}

// FIX: Added `page` parameter defaulting to 1
export const searchSongs = async (query: string, page: number = 1): Promise<Song[]> => {
  if (!query) return [];
  
  try {
    // FIX: Appended &page=${page} to the API URL. (Added limit=20 to ensure consistent batch sizes)
    const response = await fetch(`${BASE_URL}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=20`);
    const json = await response.json();

    if (json.success && json.data && json.data.results) {
      return json.data.results.map((song: any) => {
        
        // FIX #1: Change .link to .url
        const highResImage = song.image && song.image.length > 0 
          ? song.image[song.image.length - 1].url 
          : 'https://via.placeholder.com/150';

        // FIX #2: Change .link to .url
        const audioUrl = song.downloadUrl && song.downloadUrl.length > 0
          ? song.downloadUrl[song.downloadUrl.length - 1].url
          : '';

        // Safely extract primary artist names
        let artistName = 'Unknown Artist';
        if (song.artists && song.artists.primary && song.artists.primary.length > 0) {
          artistName = song.artists.primary.map((a: any) => a.name).join(', ');
        } else if (song.primaryArtists) {
          // Fallback just in case the API returns the flat string version
          artistName = song.primaryArtists;
        }

        return {
          id: song.id,
          title: song.name || song.title, // API sometimes uses 'name' instead of 'title'
          artist: artistName,
          artwork: highResImage,
          url: audioUrl,
          duration: parseInt(song.duration, 10) || 0,
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Error fetching songs:", error);
    return [];
  }
};