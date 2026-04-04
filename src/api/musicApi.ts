const baseUrl = 'https://jiosaavn-api5.vercel.app/api';

export interface Song {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  url: string;
  duration: number;
}

interface ApiImage {
  url: string;
}

interface ApiDownloadUrl {
  url: string;
}

interface ApiArtist {
  name: string;
}

interface ApiSong {
  id: string;
  name?: string;
  title?: string;
  duration?: string;
  image?: ApiImage[];
  downloadUrl?: ApiDownloadUrl[];
  primaryArtists?: string;
  artists?: {
    primary?: ApiArtist[];
  };
}

interface SearchResponse {
  success: boolean;
  data?: {
    results?: ApiSong[];
  };
}

export const searchSongs = async (
  query: string,
  page: number = 1
): Promise<Song[]> => {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${baseUrl}/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=20`
    );

    const json: SearchResponse = await response.json();

    if (!json.success || !json.data?.results) {
      return [];
    }

    return json.data.results.map((song): Song => {
      const highResImage =
        song.image && song.image.length > 0
          ? song.image[song.image.length - 1].url
          : 'https://via.placeholder.com/150';

      const audioUrl =
        song.downloadUrl && song.downloadUrl.length > 0
          ? song.downloadUrl[song.downloadUrl.length - 1].url
          : '';

      let artistName = 'Unknown Artist';

      if (song.artists?.primary && song.artists.primary.length > 0) {
        artistName = song.artists.primary
          .map((artist) => artist.name)
          .join(', ');
      } else if (song.primaryArtists) {
        artistName = song.primaryArtists;
      }

      return {
        id: song.id,
        title: song.name ?? song.title ?? 'Unknown Title',
        artist: artistName,
        artwork: highResImage,
        url: audioUrl,
        duration: Number.parseInt(song.duration ?? '0', 10) || 0,
      };
    });
  } catch {
    return [];
  }
};
