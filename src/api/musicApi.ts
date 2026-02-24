const BASE_URL = 'https://saavn.sumit.co/api';

export interface Song {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  url: string;
  duration: number;
}
export const searchSongs = async (query: string): Promise<Song[]> => {
  if (!query) return [];
  
  try {
    const response = await fetch(`${BASE_URL}/search/songs?query=${encodeURIComponent(query)}`);
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