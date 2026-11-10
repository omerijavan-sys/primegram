import { authHeader } from "@/utils/authFetch";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Search, Play, Pause, SkipForward, SkipBack, Youtube, Download, Heart, Volume2, Wifi, WifiOff, TrendingUp, Globe, DownloadCloud } from "lucide-react";
import YouTubePlayer from "./YouTubePlayer";
import { youtubeService, YouTubeSearchResult, DownloadProgress } from "../services/YouTubeService";

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  youtubeId: string;
  isOffline?: boolean;
  downloadUrl?: string;
  playCount?: number;
  lastPlayed?: string;
}

interface SavedTrack {
  id: string;
  trackId: number;
  title: string;
  artist: string;
  duration: string;
  genre: string;
  youtubeId: string;
  addedAt: string;
  playCount?: number;
  lastPlayed?: string;
}

interface ListeningHistory {
  id: string;
  trackId: number;
  timestamp: string;
}

export const tracks: Track[] = [
  // POP HITS
  { id: 1, title: "Blinding Lights", artist: "The Weeknd", duration: "3:20", genre: "Pop", youtubeId: "4NRXx6U8ABQ" },
  { id: 2, title: "Shape of You", artist: "Ed Sheeran", duration: "3:53", genre: "Pop", youtubeId: "JGwWNGJdvx8" },
  { id: 4, title: "Billie Jean", artist: "Michael Jackson", duration: "4:54", genre: "Pop", youtubeId: "Zi_XLOBDo_Y" },
  { id: 7, title: "Levitating", artist: "Dua Lipa", duration: "3:23", genre: "Pop", youtubeId: "TUVcZfQe-Kw" },
  { id: 8, title: "Bad Guy", artist: "Billie Eilish", duration: "3:14", genre: "Pop", youtubeId: "DyDfgMOUjCI" },
  { id: 11, title: "Rolling in the Deep", artist: "Adele", duration: "3:48", genre: "Pop", youtubeId: "rYEDA3JcQqw" },
  { id: 14, title: "Someone Like You", artist: "Adele", duration: "4:45", genre: "Pop", youtubeId: "hLQl3WQQoQ0" },
  { id: 15, title: "Starboy", artist: "The Weeknd", duration: "3:50", genre: "Pop", youtubeId: "34Na4j8AVgA" },
  { id: 17, title: "Flowers", artist: "Miley Cyrus", duration: "3:20", genre: "Pop", youtubeId: "G7KNmW9a75Y" },
  { id: 18, title: "Anti-Hero", artist: "Taylor Swift", duration: "3:20", genre: "Pop", youtubeId: "b1kbLwvqugk" },
  { id: 19, title: "As It Was", artist: "Harry Styles", duration: "2:47", genre: "Pop", youtubeId: "H5v3kku4y6Q" },
  { id: 20, title: "Stay", artist: "The Kid LAROI & Justin Bieber", duration: "2:21", genre: "Pop", youtubeId: "kTJczUoc26U" },
  { id: 21, title: "Peaches", artist: "Justin Bieber", duration: "3:18", genre: "Pop", youtubeId: "tQ0yjYUFKAE" },
  { id: 22, title: "Watermelon Sugar", artist: "Harry Styles", duration: "2:54", genre: "Pop", youtubeId: "E07s5ZYadZw" },
  { id: 23, title: "Savage Love", artist: "Jawsh 685 & Jason Derulo", duration: "2:51", genre: "Pop", youtubeId: "gUci-tsiU4I" },
  { id: 28, title: "Havana", artist: "Camila Cabello", duration: "3:37", genre: "Pop", youtubeId: "BQ0mxQXmLsk" },
  { id: 30, title: "Dance Monkey", artist: "Tones and I", duration: "3:29", genre: "Pop", youtubeId: "q0hyYWKXF0Q" },
  { id: 31, title: "Shallow", artist: "Lady Gaga & Bradley Cooper", duration: "3:35", genre: "Pop", youtubeId: "bo_efPm-wR0" },
  { id: 32, title: "Circles", artist: "Post Malone", duration: "3:35", genre: "Pop", youtubeId: "wXhThyZbJx8" },
  { id: 33, title: "Memories", artist: "Maroon 5", duration: "3:09", genre: "Pop", youtubeId: "SlPhMPnQ58s" },
  { id: 34, title: "Señorita", artist: "Shawn Mendes & Camila Cabello", duration: "3:11", genre: "Pop", youtubeId: "Pkh8QqU4J7w" },
  { id: 35, title: "Someone You Loved", artist: "Lewis Capaldi", duration: "3:02", genre: "Pop", youtubeId: "zABLRRfsa_0" },
  { id: 36, title: "Don't Start Now", artist: "Dua Lipa", duration: "3:03", genre: "Pop", youtubeId: "oy2fDQytz-E" },
  { id: 37, title: "Adore You", artist: "Harry Styles", duration: "3:27", genre: "Pop", youtubeId: "X2Z_2P1jx3I" },
  { id: 38, title: "Intentions", artist: "Justin Bieber ft. Quavo", duration: "3:33", genre: "Pop", youtubeId: "Jt3Ct5g2Jx8" },
  { id: 39, title: "Mood", artist: "24kGoldn ft. iann dior", duration: "2:20", genre: "Pop", youtubeId: "A3y6XgjJcHY" },
  { id: 40, title: "Good 4 U", artist: "Olivia Rodrigo", duration: "2:58", genre: "Pop", youtubeId: "Q7lDr7_s7E0" },

  // ROCK CLASSICS
  { id: 3, title: "Bohemian Rhapsody", artist: "Queen", duration: "5:55", genre: "Rock", youtubeId: "fJ9rUzIMcZQ" },
  { id: 5, title: "Smells Like Teen Spirit", artist: "Nirvana", duration: "5:01", genre: "Rock", youtubeId: "hTWKbfoikeg" },
  { id: 6, title: "Hotel California", artist: "Eagles", duration: "6:30", genre: "Rock", youtubeId: "BciS5krYL80" },
  { id: 9, title: "Stairway to Heaven", artist: "Led Zeppelin", duration: "8:02", genre: "Rock", youtubeId: "QkF3oxziUI4" },
  { id: 25, title: "Thunder", artist: "Imagine Dragons", duration: "3:07", genre: "Rock", youtubeId: "fKopy74weus" },
  { id: 26, title: "Believer", artist: "Imagine Dragons", duration: "3:24", genre: "Rock", youtubeId: "7wtfhZwyrcc" },
  { id: 41, title: "Sweet Child O' Mine", artist: "Guns N' Roses", duration: "5:56", genre: "Rock", youtubeId: "1w7OgIMMRc4" },
  { id: 42, title: "Dream On", artist: "Aerosmith", duration: "4:28", genre: "Rock", youtubeId: "9eR0a1mU_X0" },
  { id: 43, title: "Back in Black", artist: "AC/DC", duration: "4:15", genre: "Rock", youtubeId: "pAgnJDJi4dM" },
  { id: 44, title: "We Will Rock You", artist: "Queen", duration: "2:02", genre: "Rock", youtubeId: "iir-gtY-7fc" },
  { id: 45, title: "Another One Bites the Dust", artist: "Queen", duration: "3:35", genre: "Rock", youtubeId: "07Xk3r9Sj4o" },
  { id: 46, title: "Don't Stop Believin'", artist: "Journey", duration: "4:10", genre: "Rock", youtubeId: "1k8craCGpgs" },
  { id: 47, title: "Livin' on a Prayer", artist: "Bon Jovi", duration: "4:09", genre: "Rock", youtubeId: "lDK9QqIzhwk" },
  { id: 48, title: "Eye of the Tiger", artist: "Survivor", duration: "4:04", genre: "Rock", youtubeId: "btPJPFsVnRo" },
  { id: 49, title: "Highway to Hell", artist: "AC/DC", duration: "3:28", genre: "Rock", youtubeId: "gEPmA3USJdM" },
  { id: 50, title: "Born to Run", artist: "Bruce Springsteen", duration: "4:30", genre: "Rock", youtubeId: "Z4ZAWHgJScI" },

  // HIP-HOP & RAP
  { id: 10, title: "Lose Yourself", artist: "Eminem", duration: "5:26", genre: "Hip-Hop", youtubeId: "_Yhyp-_hX2s" },
  { id: 12, title: "Humble", artist: "Kendrick Lamar", duration: "2:57", genre: "Hip-Hop", youtubeId: "tvTRZJ-4EyI" },
  { id: 16, title: "God's Plan", artist: "Drake", duration: "3:18", genre: "Hip-Hop", youtubeId: "xpVfcZ0ZcFM" },
  { id: 24, title: "Rockstar", artist: "Post Malone ft. 21 Savage", duration: "3:38", genre: "Hip-Hop", youtubeId: "UceaB4D0jpo" },
  { id: 29, title: "Old Town Road", artist: "Lil Nas X", duration: "1:53", genre: "Hip-Hop", youtubeId: "r7qovpFAGrQ" },
  { id: 51, title: "Sicko Mode", artist: "Travis Scott", duration: "5:12", genre: "Hip-Hop", youtubeId: "6snsVtx2A3E" },
  { id: 52, title: "God's Plan", artist: "Drake", duration: "3:18", genre: "Hip-Hop", youtubeId: "xpVfcZ0ZcFM" },
  { id: 53, title: "Hotline Bling", artist: "Drake", duration: "4:27", genre: "Hip-Hop", youtubeId: "uxpDa-c-4Mc" },
  { id: 54, title: "HUMBLE.", artist: "Kendrick Lamar", duration: "2:57", genre: "Hip-Hop", youtubeId: "tvTRZJ-4EyI" },
  { id: 55, title: "DNA.", artist: "Kendrick Lamar", duration: "3:05", genre: "Hip-Hop", youtubeId: "NL3R2i1i5Qk" },
  { id: 56, title: "Lucid Dreams", artist: "Juice WRLD", duration: "3:59", genre: "Hip-Hop", youtubeId: "mzB1VG8bP94" },
  { id: 57, title: "All the Stars", artist: "Kendrick Lamar & SZA", duration: "3:55", genre: "Hip-Hop", youtubeId: "47YClJm2U2I" },
  { id: 58, title: "Mo Bamba", artist: "Sheck Wes", duration: "2:42", genre: "Hip-Hop", youtubeId: "hT_nvWreIhg" },
  { id: 59, title: "Zeze", artist: "Kodak Black ft. Travis Scott & Offset", duration: "3:32", genre: "Hip-Hop", youtubeId: "4iJ5D5t7BQc" },
  { id: 60, title: "Suge", artist: "DaBaby", duration: "3:25", genre: "Hip-Hop", youtubeId: "EWnj5X2qRmM" },

  // FUNK & DISCO
  { id: 13, title: "Uptown Funk", artist: "Bruno Mars", duration: "4:30", genre: "Funk", youtubeId: "OPf0YbXqDm0" },
  { id: 61, title: "September", artist: "Earth, Wind & Fire", duration: "3:35", genre: "Funk", youtubeId: "pLi8ZtT0QfY" },
  { id: 62, title: "Don't Stop 'Til You Get Enough", artist: "Michael Jackson", duration: "6:05", genre: "Funk", youtubeId: "yZR2qVbQ7g0" },
  { id: 63, title: "Superstition", artist: "Stevie Wonder", duration: "4:26", genre: "Funk", youtubeId: "00lFLGbV3KQ" },
  { id: 64, title: "Play That Funky Music", artist: "Wild Cherry", duration: "3:15", genre: "Funk", youtubeId: "VgSQE41Hk2E" },
  { id: 65, title: "Le Freak", artist: "Chic", duration: "5:26", genre: "Funk", youtubeId: "fDx3w3T2W2g" },
  { id: 66, title: "Good Times", artist: "Chic", duration: "3:21", genre: "Funk", youtubeId: "dFf4T4JvJpQ" },
  { id: 67, title: "Brick House", artist: "The Commodores", duration: "3:00", genre: "Funk", youtubeId: "Bv6M_u2S2I8" },
  { id: 68, title: "Give Up the Funk", artist: "Parliament", duration: "5:53", genre: "Funk", youtubeId: "6x6J7Y3qZ0M" },
  { id: 69, title: "Flash Light", artist: "Parliament", duration: "4:18", genre: "Funk", youtubeId: "JkM8t6Y5JlM" },

  // LATIN & REGGAETON
  { id: 27, title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", duration: "4:42", genre: "Latin", youtubeId: "kJQP7kiw5Fk" },
  { id: 70, title: "Bailando", artist: "Enrique Iglesias ft. Descemer Bueno & Gente De Zona", duration: "4:03", genre: "Latin", youtubeId: "krY4w4T9IcE" },
  { id: 71, title: "Danza Kuduro", artist: "Don Omar ft. Lucenzo", duration: "3:34", genre: "Latin", youtubeId: "EC8mx2Vg7xY" },
  { id: 72, title: "Gasolina", artist: "Daddy Yankee", duration: "3:20", genre: "Latin", youtubeId: "cFWK7d9A1fM" },
  { id: 73, title: "Mi Gente", artist: "J Balvin & Willy William", duration: "3:05", genre: "Latin", youtubeId: "wnJ6LuUFpMo" },
  { id: 74, title: "Taki Taki", artist: "DJ Snake ft. Selena Gomez, Ozuna & Cardi B", duration: "3:32", genre: "Latin", youtubeId: "hcE848X6B6M" },
  { id: 75, title: "Con Calma", artist: "Daddy Yankee ft. Katy Perry", duration: "3:10", genre: "Latin", youtubeId: "CfihzWRqfwQ" },
  { id: 76, title: "Bichota", artist: "Kali Uchis", duration: "2:44", genre: "Latin", youtubeId: "vXWu9i5j1bM" },
  { id: 77, title: "Dakiti", artist: "Bad Bunny & Jhay Cortez", duration: "4:21", genre: "Latin", youtubeId: "BfF2g8iMh8g" },
  { id: 78, title: "La Tortura", artist: "Shakira ft. Alejandro Sanz", duration: "3:32", genre: "Latin", youtubeId: "R5yAMiRH9pM" },

  // ELECTRONIC & EDM
  { id: 79, title: "Titanium", artist: "David Guetta ft. Sia", duration: "4:05", genre: "Electronic", youtubeId: "JUwJt5q_5lI" },
  { id: 80, title: "Wake Me Up", artist: "Avicii", duration: "4:07", genre: "Electronic", youtubeId: "IcrbM1lIBoQ" },
  { id: 81, title: "Clarity", artist: "Zedd ft. Foxes", duration: "4:31", genre: "Electronic", youtubeId: "I-12dsvB1mM" },
  { id: 82, title: "Animals", artist: "Martin Garrix", duration: "5:03", genre: "Electronic", youtubeId: "gCYcHz2k5x0" },
  { id: 83, title: "Faded", artist: "Alan Walker", duration: "3:32", genre: "Electronic", youtubeId: "60ItHLz5WEA" },
  { id: 84, title: "Closer", artist: "The Chainsmokers ft. Halsey", duration: "4:04", genre: "Electronic", youtubeId: "PT2w-mlSXLI" },
  { id: 85, title: "Don't Let Me Down", artist: "The Chainsmokers ft. Daya", duration: "3:32", genre: "Electronic", youtubeId: "IoEfAMeT_gs" },
  { id: 86, title: "Something Just Like This", artist: "The Chainsmokers & Coldplay", duration: "4:07", genre: "Electronic", youtubeId: "NF2o9cXg0M" },
  { id: 87, title: "Starboy", artist: "The Weeknd ft. Daft Punk", duration: "3:50", genre: "Electronic", youtubeId: "34Na4j8AVgA" },
  { id: 88, title: "One Dance", artist: "Drake ft. WizKid & Kyla", duration: "2:54", genre: "Electronic", youtubeId: "ki0NyPfbcq8" },

  // R&B & SOUL
  { id: 89, title: "Thinking Out Loud", artist: "Ed Sheeran", duration: "4:41", genre: "R&B", youtubeId: "lp-EO5I60ZA" },
  { id: 90, title: "All of Me", artist: "John Legend", duration: "4:29", genre: "R&B", youtubeId: "450p7goT2o4" },
  { id: 91, title: "Stay With Me", artist: "Sam Smith", duration: "2:52", genre: "R&B", youtubeId: "o_8a2Jh4q0g" },
  { id: 92, title: "Love Me Like You Do", artist: "Ellie Goulding", duration: "4:09", genre: "R&B", youtubeId: "JRB8_BtYz9M" },
  { id: 93, title: "I'm Not the Only One", artist: "Sam Smith", duration: "3:58", genre: "R&B", youtubeId: "nC-qxJ5yJxQ" },
  { id: 94, title: "Hello", artist: "Adele", duration: "4:55", genre: "R&B", youtubeId: "YQHsXMglC9A" },
  { id: 95, title: "When I Was Your Man", artist: "Bruno Mars", duration: "3:33", genre: "R&B", youtubeId: "ekzHIouo8QQ" },
  { id: 96, title: "Grenade", artist: "Bruno Mars", duration: "3:39", genre: "R&B", youtubeId: "SR6iYWJxHq8" },
  { id: 97, title: "Just the Way You Are", artist: "Bruno Mars", duration: "3:39", genre: "R&B", youtubeId: "LjhCEhHybAk" },
  { id: 98, title: "Perfect", artist: "Ed Sheeran", duration: "4:23", genre: "R&B", youtubeId: "2Vv-BfVoq5I" },

  // JAZZ & CLASSICAL
  { id: 99, title: "Fly Me to the Moon", artist: "Frank Sinatra", duration: "2:28", genre: "Jazz", youtubeId: "Mm0eB4v3mZc" },
  { id: 100, title: "What a Wonderful World", artist: "Louis Armstrong", duration: "2:19", genre: "Jazz", youtubeId: "A3yCcEI4U0U" },
  { id: 101, title: "Take Five", artist: "Dave Brubeck", duration: "5:24", genre: "Jazz", youtubeId: "vmDDOFXSgAs" },
  { id: 102, title: "So What", artist: "Miles Davis", duration: "9:22", genre: "Jazz", youtubeId: "wOa7z9lYcYQ" },
  { id: 103, title: "Blue Moon", artist: "Billie Holiday", duration: "3:18", genre: "Jazz", youtubeId: "k7X7O7tHq7o" },
  { id: 104, title: "Canon in D", artist: "Johann Pachelbel", duration: "5:01", genre: "Classical", youtubeId: "hOA-2R1_iwg" },
  { id: 105, title: "Four Seasons - Spring", artist: "Vivaldi", duration: "10:31", genre: "Classical", youtubeId: "GRmofU8KBT0" },
  { id: 106, title: "Moonlight Sonata", artist: "Beethoven", duration: "5:15", genre: "Classical", youtubeId: "4Tr0otuiQuU" },
  { id: 107, title: "Clair de Lune", artist: "Claude Debussy", duration: "5:08", genre: "Classical", youtubeId: "vDQa6x8iE1U" },
  { id: 108, title: "Boléro", artist: "Maurice Ravel", duration: "15:50", genre: "Classical", youtubeId: "69V__pZ3y6E" },

  // INDIE & ALTERNATIVE
  { id: 109, title: "Mr. Brightside", artist: "The Killers", duration: "3:41", genre: "Indie", youtubeId: "GgVxB6y12k8" },
  { id: 110, title: "Somebody Told Me", artist: "The Killers", duration: "3:17", genre: "Indie", youtubeId: "jKjUwX7c8xk" },
  { id: 111, title: "Take Me Out", artist: "Franz Ferdinand", duration: "3:57", genre: "Indie", youtubeId: "juBqJk5jQfM" },
  { id: 112, title: "Float On", artist: "Modest Mouse", duration: "3:32", genre: "Indie", youtubeId: "CTAud5OJQsA" },
  { id: 113, title: "Seven Nation Army", artist: "The White Stripes", duration: "3:52", genre: "Indie", youtubeId: "0jgrCKhxE1s" },
  { id: 114, title: "Ho Hey", artist: "The Lumineers", duration: "2:41", genre: "Indie", youtubeId: "CevxZvSJouk" },
  { id: 115, title: "Little Talks", artist: "Of Monsters and Men", duration: "4:26", genre: "Indie", youtubeId: "gh6jHd0FB9M" },
  { id: 116, title: "Pumped Up Kicks", artist: "Foster the People", duration: "3:59", genre: "Indie", youtubeId: "SDTZdmrA3_o" },
  { id: 117, title: "Radioactive", artist: "Imagine Dragons", duration: "3:06", genre: "Indie", youtubeId: "ktvTqknDobU" },
  { id: 118, title: "Demons", artist: "Imagine Dragons", duration: "2:57", genre: "Indie", youtubeId: "F5Q_0g2mJ9E" },

  // COUNTRY
  { id: 119, title: "Old Town Road", artist: "Lil Nas X ft. Billy Ray Cyrus", duration: "2:37", genre: "Country", youtubeId: "r7qovpFAGrQ" },
  { id: 120, title: "Body Like a Back Road", artist: "Sam Hunt", duration: "3:19", genre: "Country", youtubeId: "FjNdYg2m9_8" },
  { id: 121, title: "The Gambler", artist: "Kenny Rogers", duration: "3:33", genre: "Country", youtubeId: "7h2q8J8cW9M" },
  { id: 122, title: "Friends in Low Places", artist: "Garth Brooks", duration: "4:18", genre: "Country", youtubeId: "n2r2t1A8d1w" },
  { id: 123, title: "Take Me Home, Country Roads", artist: "John Denver", duration: "3:09", genre: "Country", youtubeId: "1vrEljMfD-8" },
  { id: 124, title: "Jolene", artist: "Dolly Parton", duration: "2:42", genre: "Country", youtubeId: "C-MaIy-2LmU" },
  { id: 125, title: "Ring of Fire", artist: "Johnny Cash", duration: "2:38", genre: "Country", youtubeId: "itAa6I3G1d8" },
  { id: 126, title: "I Walk the Line", artist: "Johnny Cash", duration: "2:33", genre: "Country", youtubeId: "h2I-2Lq3q6c" },
  { id: 127, title: "On the Road Again", artist: "Willie Nelson", duration: "2:33", genre: "Country", youtubeId: "dFqLpiGkXP8" },
  { id: 128, title: "Wagon Wheel", artist: "Darius Rucker", duration: "3:43", genre: "Country", youtubeId: "h1PpFG_5M_U" },

  // METAL
  { id: 129, title: "Enter Sandman", artist: "Metallica", duration: "5:31", genre: "Metal", youtubeId: "CD-E-LqC-3I" },
  { id: 130, title: "Master of Puppets", artist: "Metallica", duration: "8:36", genre: "Metal", youtubeId: "wNNfYME1K5g" },
  { id: 131, title: "Nothing Else Matters", artist: "Metallica", duration: "6:28", genre: "Metal", youtubeId: "Tj75ZhqLqUQ" },
  { id: 132, title: "Crazy Train", artist: "Ozzy Osbourne", duration: "4:51", genre: "Metal", youtubeId: "QkF3oxziUI4" },
  { id: 133, title: "Paranoid", artist: "Black Sabbath", duration: "2:48", genre: "Metal", youtubeId: "dQw4w9WgXcQ" },
  { id: 134, title: "Iron Man", artist: "Black Sabbath", duration: "5:56", genre: "Metal", youtubeId: "dQw4w9WgXcQ" },
  { id: 135, title: "Smoke on the Water", artist: "Deep Purple", duration: "5:40", genre: "Metal", youtubeId: "dQw4w9WgXcQ" },
  { id: 136, title: "Highway Star", artist: "Deep Purple", duration: "6:05", genre: "Metal", youtubeId: "dQw4w9WgXcQ" },
  { id: 137, title: "Breaking the Law", artist: "Judas Priest", duration: "2:35", genre: "Metal", youtubeId: "dQw4w9WgXcQ" },
  { id: 138, title: "The Trooper", artist: "Iron Maiden", duration: "4:12", genre: "Metal", youtubeId: "dQw4w9WgXcQ" },

  // REGGAE
  { id: 139, title: "No Woman No Cry", artist: "Bob Marley", duration: "4:06", genre: "Reggae", youtubeId: "Y2Swn2Y5dX8" },
  { id: 140, title: "One Love", artist: "Bob Marley", duration: "2:55", genre: "Reggae", youtubeId: "bJeD-A5aV1c" },
  { id: 141, title: "Three Little Birds", artist: "Bob Marley", duration: "3:00", genre: "Reggae", youtubeId: "zaWU-NWb9JA" },
  { id: 142, title: "Buffalo Soldier", artist: "Bob Marley", duration: "4:15", genre: "Reggae", youtubeId: "zaWU-NWb9JA" },
  { id: 143, title: "Stir It Up", artist: "Bob Marley", duration: "5:33", genre: "Reggae", youtubeId: "zaWU-NWb9JA" },
  { id: 144, title: "Could You Be Loved", artist: "Bob Marley", duration: "3:36", genre: "Reggae", youtubeId: "zaWU-NWb9JA" },
  { id: 145, title: "Jamming", artist: "Bob Marley", duration: "3:31", genre: "Reggae", youtubeId: "zaWU-NWb9JA" },
  { id: 146, title: "Redemption Song", artist: "Bob Marley", duration: "3:49", genre: "Reggae", youtubeId: "zaWU-NWb9JA" },
  { id: 147, title: "Get Up, Stand Up", artist: "Bob Marley", duration: "3:25", genre: "Reggae", youtubeId: "zaWU-NWb9JA" },
  { id: 148, title: "I Shot the Sheriff", artist: "Bob Marley", duration: "4:40", genre: "Reggae", youtubeId: "zaWU-NWb9JA" },

  // BLUES
  { id: 149, title: "The Thrill Is Gone", artist: "B.B. King", duration: "5:25", genre: "Blues", youtubeId: "Y2Swn2Y5dX8" },
  { id: 150, title: "Sweet Home Chicago", artist: "Robert Johnson", duration: "2:57", genre: "Blues", youtubeId: "Y2Swn2Y5dX8" },
  { id: 151, title: "Cross Road Blues", artist: "Robert Johnson", duration: "2:31", genre: "Blues", youtubeId: "Y2Swn2Y5dX8" },
  { id: 152, title: "Stormy Monday", artist: "T-Bone Walker", duration: "4:45", genre: "Blues", youtubeId: "Y2Swn2Y5dX8" },
  { id: 153, title: "Born Under a Bad Sign", artist: "Albert King", duration: "2:45", genre: "Blues", youtubeId: "Y2Swn2Y5dX8" },
  { id: 154, title: "Mannish Boy", artist: "Muddy Waters", duration: "3:53", genre: "Blues", youtubeId: "Y2Swn2Y5dX8" },
  { id: 155, title: "Hoochie Coochie Man", artist: "Muddy Waters", duration: "2:53", genre: "Blues", youtubeId: "Y2Swn2Y5dX8" },
  { id: 156, title: "I Can't Quit You Baby", artist: "Willie Dixon", duration: "3:13", genre: "Blues", youtubeId: "Y2Swn2Y5dX8" },
  { id: 157, title: "Dust My Broom", artist: "Elmore James", duration: "2:52", genre: "Blues", youtubeId: "Y2Swn2Y5dX8" },
  { id: 158, title: "Pride and Joy", artist: "Stevie Ray Vaughan", duration: "3:30", genre: "Blues", youtubeId: "Y2Swn2Y5dX8" },

  // AFROBEATS
  { id: 200, title: "Essence", artist: "Wizkid ft. Tems", duration: "4:08", genre: "Afrobeats", youtubeId: "GS2A2Em9Q5o" },
  { id: 201, title: "Last Last", artist: "Burna Boy", duration: "2:52", genre: "Afrobeats", youtubeId: "PHWGCnGSknk" },
  { id: 202, title: "Calm Down", artist: "Rema", duration: "3:39", genre: "Afrobeats", youtubeId: "WcIcVapfqXw" },
  { id: 203, title: "Love Nwantiti", artist: "CKay", duration: "2:00", genre: "Afrobeats", youtubeId: "Hy_D9YfZUlw" },
  { id: 204, title: "Peru", artist: "Fireboy DML", duration: "3:07", genre: "Afrobeats", youtubeId: "uQEKkF1QpDA" },
  { id: 205, title: "Ku Lo Sa", artist: "Oxlade", duration: "2:54", genre: "Afrobeats", youtubeId: "U4PWvjlNeUg" },
  { id: 206, title: "Sungba", artist: "Asake", duration: "2:24", genre: "Afrobeats", youtubeId: "rIxNuYV4t6c" },
  { id: 207, title: "Soso", artist: "Omah Lay", duration: "3:00", genre: "Afrobeats", youtubeId: "PIh2xe4jnpk" },
  { id: 208, title: "Rush", artist: "Ayra Starr", duration: "2:46", genre: "Afrobeats", youtubeId: "fE2h3lGlOsk" },
  { id: 209, title: "Buga", artist: "Kizz Daniel", duration: "3:01", genre: "Afrobeats", youtubeId: "1qHGAYrkFp4" },
  { id: 210, title: "Finesse", artist: "Pheelz ft. BNXN", duration: "2:18", genre: "Afrobeats", youtubeId: "ojcLgDVT3PE" },
  { id: 211, title: "Unavailable", artist: "Davido ft. Musa Keys", duration: "3:36", genre: "Afrobeats", youtubeId: "Z1tDjMfFsLY" },
  { id: 212, title: "City Boys", artist: "Burna Boy", duration: "2:46", genre: "Afrobeats", youtubeId: "PIh2xe4jnpk" },

  // K-POP
  { id: 220, title: "Dynamite", artist: "BTS", duration: "3:19", genre: "K-Pop", youtubeId: "gdZLi9oWNZg" },
  { id: 221, title: "Butter", artist: "BTS", duration: "2:44", genre: "K-Pop", youtubeId: "WMweEpGlu_U" },
  { id: 222, title: "How You Like That", artist: "BLACKPINK", duration: "3:01", genre: "K-Pop", youtubeId: "ioNng23DkIM" },
  { id: 223, title: "Kill This Love", artist: "BLACKPINK", duration: "3:09", genre: "K-Pop", youtubeId: "2S24-y0Ij3Y" },
  { id: 224, title: "Pink Venom", artist: "BLACKPINK", duration: "3:07", genre: "K-Pop", youtubeId: "gQlMMD8auMs" },
  { id: 225, title: "Money", artist: "Lisa", duration: "2:30", genre: "K-Pop", youtubeId: "dMxj7gA37Yw" },
  { id: 226, title: "Lalisa", artist: "Lisa", duration: "3:15", genre: "K-Pop", youtubeId: "awkkyBH2zEo" },
  { id: 227, title: "Boy With Luv", artist: "BTS", duration: "3:50", genre: "K-Pop", youtubeId: "XsX3ATc3FbA" },
  { id: 228, title: "Next Level", artist: "aespa", duration: "3:39", genre: "K-Pop", youtubeId: "4TWR90KJl84" },
  { id: 229, title: "Savage", artist: "aespa", duration: "4:08", genre: "K-Pop", youtubeId: "WPdWvnAAurg" },
  { id: 230, title: "TT", artist: "TWICE", duration: "3:35", genre: "K-Pop", youtubeId: "ePpPVE-GGJw" },
  { id: 231, title: "God's Menu", artist: "Stray Kids", duration: "3:16", genre: "K-Pop", youtubeId: "TQTlCHxyuu8" },
  { id: 232, title: "Maniac", artist: "Stray Kids", duration: "3:12", genre: "K-Pop", youtubeId: "tDukImFzj7w" },
  { id: 233, title: "Fearless", artist: "LE SSERAFIM", duration: "2:48", genre: "K-Pop", youtubeId: "G2_0c20EUho" },
  { id: 234, title: "OMG", artist: "NewJeans", duration: "3:36", genre: "K-Pop", youtubeId: "sVTy_wmn5SU" },
  { id: 235, title: "Ditto", artist: "NewJeans", duration: "3:05", genre: "K-Pop", youtubeId: "V37TaRdVUQY" },

  // LATIN
  { id: 250, title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", duration: "4:42", genre: "Latin", youtubeId: "kJQP7kiw5Fk" },
  { id: 251, title: "Tusa", artist: "Karol G & Nicki Minaj", duration: "3:20", genre: "Latin", youtubeId: "j2j93pVcfBA" },
  { id: 252, title: "Dakiti", artist: "Bad Bunny & Jhay Cortez", duration: "3:25", genre: "Latin", youtubeId: "8tlk1OYakWE" },
  { id: 253, title: "Tití Me Preguntó", artist: "Bad Bunny", duration: "4:03", genre: "Latin", youtubeId: "Cr8K88UcO0s" },
  { id: 254, title: "Me Porto Bonito", artist: "Bad Bunny & Chencho", duration: "2:58", genre: "Latin", youtubeId: "saGYMhApaH8" },
  { id: 255, title: "La Bachata", artist: "Manuel Turizo", duration: "2:43", genre: "Latin", youtubeId: "EZGEjkasccA" },
  { id: 256, title: "Pepas", artist: "Farruko", duration: "4:46", genre: "Latin", youtubeId: "9wbXZWtylcw" },
  { id: 257, title: "Provenza", artist: "Karol G", duration: "3:30", genre: "Latin", youtubeId: "9WJtjfboMRA" },
  { id: 258, title: "MAMIII", artist: "Becky G & Karol G", duration: "4:30", genre: "Latin", youtubeId: "ZJVByM3lFhQ" },
  { id: 259, title: "Hawái", artist: "Maluma", duration: "3:23", genre: "Latin", youtubeId: "p7bfOZek9T4" },
  { id: 260, title: "Felices los 4", artist: "Maluma", duration: "3:50", genre: "Latin", youtubeId: "zQYqv9JS7Cc" },

  // COUNTRY
  { id: 280, title: "Old Town Road", artist: "Lil Nas X ft. Billy Ray Cyrus", duration: "2:37", genre: "Country", youtubeId: "w2Ov5jzm3j8" },
  { id: 281, title: "Cruise", artist: "Florida Georgia Line", duration: "3:30", genre: "Country", youtubeId: "5jlI4uzZGjU" },
  { id: 282, title: "Body Like a Back Road", artist: "Sam Hunt", duration: "2:45", genre: "Country", youtubeId: "Mdh2p03cRfw" },
  { id: 283, title: "Meant to Be", artist: "Bebe Rexha & FGL", duration: "2:43", genre: "Country", youtubeId: "uV3XwGdYUUk" },
  { id: 284, title: "The Bones", artist: "Maren Morris", duration: "3:00", genre: "Country", youtubeId: "L_4hUKgUwUw" },
  { id: 285, title: "Tennessee Whiskey", artist: "Chris Stapleton", duration: "4:53", genre: "Country", youtubeId: "4zAThXFOy2c" },
  { id: 286, title: "Fancy Like", artist: "Walker Hayes", duration: "2:40", genre: "Country", youtubeId: "FtbJaXqnTfg" },
  { id: 287, title: "You Proof", artist: "Morgan Wallen", duration: "2:42", genre: "Country", youtubeId: "qoCLstpLnFM" },
  { id: 288, title: "Last Night", artist: "Morgan Wallen", duration: "2:43", genre: "Country", youtubeId: "AlrkpZqo7Cs" },
  { id: 289, title: "Wagon Wheel", artist: "Darius Rucker", duration: "4:53", genre: "Country", youtubeId: "hcdDQcWiwj4" },
  { id: 290, title: "Need You Now", artist: "Lady A", duration: "4:37", genre: "Country", youtubeId: "eM213aMKTHg" },

  // EDM / HOUSE / DANCE
  { id: 310, title: "Levels", artist: "Avicii", duration: "5:39", genre: "EDM", youtubeId: "_ovdm2yX4MA" },
  { id: 311, title: "Wake Me Up", artist: "Avicii", duration: "4:09", genre: "EDM", youtubeId: "IcrbM1l_BoI" },
  { id: 312, title: "Hey Brother", artist: "Avicii", duration: "4:15", genre: "EDM", youtubeId: "6Cp6mKbRTQY" },
  { id: 313, title: "Animals", artist: "Martin Garrix", duration: "5:04", genre: "EDM", youtubeId: "gCYcHz2k5x0" },
  { id: 314, title: "In the Name of Love", artist: "Martin Garrix & Bebe Rexha", duration: "3:16", genre: "EDM", youtubeId: "RH7DRn3JBuc" },
  { id: 315, title: "Scared to Be Lonely", artist: "Martin Garrix & Dua Lipa", duration: "3:41", genre: "EDM", youtubeId: "fyaI4-5849w" },
  { id: 316, title: "Don't You Worry Child", artist: "Swedish House Mafia", duration: "3:32", genre: "EDM", youtubeId: "1y6smkh6c-0" },
  { id: 317, title: "Titanium", artist: "David Guetta ft. Sia", duration: "4:05", genre: "EDM", youtubeId: "JRfuAukYTKg" },
  { id: 318, title: "Memories", artist: "David Guetta & Kid Cudi", duration: "3:30", genre: "EDM", youtubeId: "BeSRJ0wcpVA" },
  { id: 319, title: "Lean On", artist: "Major Lazer & DJ Snake", duration: "2:56", genre: "EDM", youtubeId: "YqeW9_5kURI" },
  { id: 320, title: "Closer", artist: "The Chainsmokers ft. Halsey", duration: "4:04", genre: "EDM", youtubeId: "PT2_F-1esPk" },
  { id: 321, title: "Don't Let Me Down", artist: "Chainsmokers ft. Daya", duration: "3:28", genre: "EDM", youtubeId: "Io0fBr1XBUA" },
  { id: 322, title: "Faded", artist: "Alan Walker", duration: "3:32", genre: "EDM", youtubeId: "60ItHLz5WEA" },
  { id: 323, title: "Alone", artist: "Alan Walker", duration: "2:42", genre: "EDM", youtubeId: "1-xGerv5FOk" },
  { id: 324, title: "On My Way", artist: "Alan Walker, Sabrina C, Farruko", duration: "3:15", genre: "EDM", youtubeId: "dhYOPzcsbGM" },
  { id: 325, title: "Stay", artist: "Zedd ft. Alessia Cara", duration: "3:31", genre: "EDM", youtubeId: "Ohh-1mEsqDY" },
  { id: 326, title: "The Middle", artist: "Zedd, Maren Morris, Grey", duration: "3:04", genre: "EDM", youtubeId: "Y2V6yjjPbX0" },

  // R&B / SOUL
  { id: 350, title: "Earned It", artist: "The Weeknd", duration: "4:37", genre: "R&B", youtubeId: "waU75jdUnYw" },
  { id: 351, title: "Stay With Me", artist: "Sam Smith", duration: "2:52", genre: "R&B", youtubeId: "pB-5XG-DbAA" },
  { id: 352, title: "Thinking Out Loud", artist: "Ed Sheeran", duration: "4:41", genre: "R&B", youtubeId: "lp-EO5I60KA" },
  { id: 353, title: "Sunflower", artist: "Post Malone & Swae Lee", duration: "2:38", genre: "R&B", youtubeId: "ApXoWvfEYVU" },
  { id: 354, title: "Location", artist: "Khalid", duration: "3:56", genre: "R&B", youtubeId: "_91DJN1S2hg" },
  { id: 355, title: "Talk", artist: "Khalid", duration: "3:18", genre: "R&B", youtubeId: "OF7lLJ8eY1k" },
  { id: 356, title: "Best Part", artist: "Daniel Caesar ft. H.E.R.", duration: "3:29", genre: "R&B", youtubeId: "TfTRYRzz4Hk" },
  { id: 357, title: "Pick Up Your Feelings", artist: "Jazmine Sullivan", duration: "3:33", genre: "R&B", youtubeId: "qxAyjAUUUz4" },
  { id: 358, title: "Leave The Door Open", artist: "Silk Sonic", duration: "4:02", genre: "R&B", youtubeId: "adLGHcj_fmA" },
  { id: 359, title: "Skate", artist: "Silk Sonic", duration: "3:14", genre: "R&B", youtubeId: "uYFRpD7K_a4" },
  { id: 360, title: "Snooze", artist: "SZA", duration: "3:21", genre: "R&B", youtubeId: "AdvKqyrIqIw" },
  { id: 361, title: "Kill Bill", artist: "SZA", duration: "2:33", genre: "R&B", youtubeId: "yufy_NEzqAc" },
  { id: 362, title: "Good Days", artist: "SZA", duration: "4:39", genre: "R&B", youtubeId: "BTcD6JsCndA" },

  // HIP-HOP / TRAP / DRILL
  { id: 380, title: "Sicko Mode", artist: "Travis Scott", duration: "5:12", genre: "Hip-Hop", youtubeId: "6ONRf7h3Mdk" },
  { id: 381, title: "Highest in the Room", artist: "Travis Scott", duration: "2:55", genre: "Hip-Hop", youtubeId: "yqA2j0Tom6Y" },
  { id: 382, title: "Goosebumps", artist: "Travis Scott", duration: "4:03", genre: "Hip-Hop", youtubeId: "Dst9gZkq1a8" },
  { id: 383, title: "Lucid Dreams", artist: "Juice WRLD", duration: "3:59", genre: "Hip-Hop", youtubeId: "mzB1VGEGcSU" },
  { id: 384, title: "Rockstar", artist: "Post Malone ft. 21 Savage", duration: "3:38", genre: "Hip-Hop", youtubeId: "UceaB4D0jpo" },
  { id: 385, title: "Congratulations", artist: "Post Malone ft. Quavo", duration: "3:40", genre: "Hip-Hop", youtubeId: "SC4xMk98Pdc" },
  { id: 386, title: "Industry Baby", artist: "Lil Nas X & Jack Harlow", duration: "3:32", genre: "Hip-Hop", youtubeId: "UTHLKHL_whs" },
  { id: 387, title: "Montero", artist: "Lil Nas X", duration: "2:17", genre: "Hip-Hop", youtubeId: "6swmTBVI83k" },
  { id: 388, title: "Wait For U", artist: "Future ft. Drake & Tems", duration: "3:09", genre: "Hip-Hop", youtubeId: "I76klF06Wmw" },
  { id: 389, title: "First Class", artist: "Jack Harlow", duration: "2:53", genre: "Hip-Hop", youtubeId: "GK_-WhuLQE0" },
  { id: 390, title: "Hotline Bling", artist: "Drake", duration: "4:27", genre: "Hip-Hop", youtubeId: "uxpDa-c-4Mc" },
  { id: 391, title: "God's Plan", artist: "Drake", duration: "3:18", genre: "Hip-Hop", youtubeId: "xpVfcZ0ZcFM" },
  { id: 392, title: "In My Feelings", artist: "Drake", duration: "3:37", genre: "Hip-Hop", youtubeId: "DRS_PpOrUZ4" },
  { id: 393, title: "Started From the Bottom", artist: "Drake", duration: "2:53", genre: "Hip-Hop", youtubeId: "RubBzkZzpUA" },
  { id: 394, title: "Dior", artist: "Pop Smoke", duration: "2:38", genre: "Hip-Hop", youtubeId: "fwawb6Wkhuc" },
  { id: 395, title: "What You Know Bout Love", artist: "Pop Smoke", duration: "2:30", genre: "Hip-Hop", youtubeId: "BB5lVMSyZHo" },
  { id: 396, title: "Body", artist: "Russ Millions & Tion Wayne", duration: "3:23", genre: "Hip-Hop", youtubeId: "ueQ-O7n7r2c" },

  // REGGAE
  { id: 420, title: "No Woman No Cry", artist: "Bob Marley", duration: "7:08", genre: "Reggae", youtubeId: "IT-zVUEFkn4" },
  { id: 421, title: "One Love", artist: "Bob Marley", duration: "2:52", genre: "Reggae", youtubeId: "vdB-8eLEW8g" },
  { id: 422, title: "Three Little Birds", artist: "Bob Marley", duration: "3:00", genre: "Reggae", youtubeId: "zaGUr6wzyT8" },
  { id: 423, title: "Buffalo Soldier", artist: "Bob Marley", duration: "4:18", genre: "Reggae", youtubeId: "uMUQMSXLlHM" },
  { id: 424, title: "Could You Be Loved", artist: "Bob Marley", duration: "3:57", genre: "Reggae", youtubeId: "0n0CHexHm5o" },
  { id: 425, title: "Welcome to Jamrock", artist: "Damian Marley", duration: "3:32", genre: "Reggae", youtubeId: "9cM4nyfrMr0" },

  // CLASSICAL
  { id: 440, title: "Für Elise", artist: "Beethoven", duration: "3:25", genre: "Classical", youtubeId: "_mVW8tgGY_w" },
  { id: 441, title: "Moonlight Sonata", artist: "Beethoven", duration: "5:51", genre: "Classical", youtubeId: "4Tr0otuiQuU" },
  { id: 442, title: "Symphony No. 9", artist: "Beethoven", duration: "9:32", genre: "Classical", youtubeId: "rOjHhS5MtvA" },
  { id: 443, title: "Canon in D", artist: "Pachelbel", duration: "5:19", genre: "Classical", youtubeId: "NlprozGcs80" },
  { id: 444, title: "Clair de Lune", artist: "Debussy", duration: "5:08", genre: "Classical", youtubeId: "CvFH_6DNRCY" },
  { id: 445, title: "Spring (Four Seasons)", artist: "Vivaldi", duration: "10:31", genre: "Classical", youtubeId: "mFWQgxXM_b8" },
  { id: 446, title: "Eine kleine Nachtmusik", artist: "Mozart", duration: "5:26", genre: "Classical", youtubeId: "oy2zDJPIgwc" },
  { id: 447, title: "Turkish March", artist: "Mozart", duration: "3:37", genre: "Classical", youtubeId: "L4ynx4XaC9o" },
  { id: 448, title: "Air on the G String", artist: "Bach", duration: "5:24", genre: "Classical", youtubeId: "tlBwIZ9rlEQ" },
  { id: 449, title: "Toccata and Fugue", artist: "Bach", duration: "9:13", genre: "Classical", youtubeId: "ho9rZjlsyYY" },

  // JAZZ
  { id: 460, title: "Take Five", artist: "Dave Brubeck Quartet", duration: "5:24", genre: "Jazz", youtubeId: "vmDDOFXSgAs" },
  { id: 461, title: "So What", artist: "Miles Davis", duration: "9:22", genre: "Jazz", youtubeId: "ylXk1LBvIqU" },
  { id: 462, title: "My Favorite Things", artist: "John Coltrane", duration: "13:42", genre: "Jazz", youtubeId: "qWG2dsXV5HI" },
  { id: 463, title: "Feeling Good", artist: "Nina Simone", duration: "2:55", genre: "Jazz", youtubeId: "oGTM3HQ6gnE" },
  { id: 464, title: "Fly Me to the Moon", artist: "Frank Sinatra", duration: "2:28", genre: "Jazz", youtubeId: "ZEcqHA7dbwM" },
  { id: 465, title: "What a Wonderful World", artist: "Louis Armstrong", duration: "2:21", genre: "Jazz", youtubeId: "VqhCQZaH4Vs" },
  { id: 466, title: "Summertime", artist: "Ella Fitzgerald", duration: "4:55", genre: "Jazz", youtubeId: "u2bigf337aU" },

  // METAL
  { id: 480, title: "Enter Sandman", artist: "Metallica", duration: "5:32", genre: "Metal", youtubeId: "CD-E-LDc384" },
  { id: 481, title: "Master of Puppets", artist: "Metallica", duration: "8:35", genre: "Metal", youtubeId: "xnKhsTXoKCI" },
  { id: 482, title: "Nothing Else Matters", artist: "Metallica", duration: "6:28", genre: "Metal", youtubeId: "tAGnKpE4NCI" },
  { id: 483, title: "Iron Man", artist: "Black Sabbath", duration: "5:55", genre: "Metal", youtubeId: "5s7_WbiR79E" },
  { id: 484, title: "Paranoid", artist: "Black Sabbath", duration: "2:50", genre: "Metal", youtubeId: "0qanF-91aJo" },
  { id: 485, title: "Run to the Hills", artist: "Iron Maiden", duration: "3:53", genre: "Metal", youtubeId: "9LIaCe9-OOk" },
  { id: 486, title: "Crazy Train", artist: "Ozzy Osbourne", duration: "4:54", genre: "Metal", youtubeId: "WI4t-nlxrQ4" },
  { id: 487, title: "Painkiller", artist: "Judas Priest", duration: "6:06", genre: "Metal", youtubeId: "0bv7kVm9NUk" },
  { id: 488, title: "Chop Suey!", artist: "System of a Down", duration: "3:30", genre: "Metal", youtubeId: "CSvFpBOe8eY" },

  // INDIE / ALT
  { id: 510, title: "Mr. Brightside", artist: "The Killers", duration: "3:42", genre: "Indie", youtubeId: "gGdGFtwCNBE" },
  { id: 511, title: "Somebody Told Me", artist: "The Killers", duration: "3:17", genre: "Indie", youtubeId: "Vw4KVoEVcr0" },
  { id: 512, title: "Dog Days Are Over", artist: "Florence + The Machine", duration: "4:13", genre: "Indie", youtubeId: "iWOyfLBYtuU" },
  { id: 513, title: "Take Me Out", artist: "Franz Ferdinand", duration: "3:58", genre: "Indie", youtubeId: "JNbZGgfMmIA" },
  { id: 514, title: "Skinny Love", artist: "Bon Iver", duration: "3:58", genre: "Indie", youtubeId: "ssdgFoHLwnk" },
  { id: 515, title: "Riptide", artist: "Vance Joy", duration: "3:24", genre: "Indie", youtubeId: "uJ_1HMAGb4k" },
  { id: 516, title: "Pumped Up Kicks", artist: "Foster the People", duration: "3:59", genre: "Indie", youtubeId: "SDTZ7iX4vTQ" },
  { id: 517, title: "Electric Feel", artist: "MGMT", duration: "3:49", genre: "Indie", youtubeId: "MmZexg8sxyk" },
  { id: 518, title: "Kids", artist: "MGMT", duration: "5:02", genre: "Indie", youtubeId: "1SiylAcXTPk" },
  { id: 519, title: "Ho Hey", artist: "The Lumineers", duration: "2:43", genre: "Indie", youtubeId: "zvCBSSwgtg4" },
  { id: 520, title: "Little Talks", artist: "Of Monsters and Men", duration: "4:27", genre: "Indie", youtubeId: "ghb6eDopW8I" },
  { id: 521, title: "Pompeii", artist: "Bastille", duration: "3:34", genre: "Indie", youtubeId: "F90Cw4l-8NY" },

  // LO-FI / CHILL
  { id: 540, title: "Lofi Hip Hop Radio", artist: "Lofi Girl", duration: "Live", genre: "Lo-Fi", youtubeId: "jfKfPfyJRdk" },
  { id: 541, title: "Coffee Shop Vibes", artist: "Chill Beats", duration: "3:30", genre: "Lo-Fi", youtubeId: "5qap5aO4i9A" },
  { id: 542, title: "Rainy Days", artist: "Lo-Fi Producer", duration: "4:12", genre: "Lo-Fi", youtubeId: "DWcJFNfaw9c" },
  { id: 543, title: "Late Night Study", artist: "Chillhop", duration: "5:00", genre: "Lo-Fi", youtubeId: "n61ULEU7CO0" },

  // SOUL / FUNK / DISCO
  { id: 560, title: "Superstition", artist: "Stevie Wonder", duration: "4:26", genre: "Soul", youtubeId: "0CFuCYNx-1g" },
  { id: 561, title: "Ain't No Mountain High Enough", artist: "Marvin Gaye", duration: "2:30", genre: "Soul", youtubeId: "-C_3eYj-pOM" },
  { id: 562, title: "I Want You Back", artist: "The Jackson 5", duration: "2:59", genre: "Soul", youtubeId: "s3Q80mk7bxE" },
  { id: 563, title: "Stayin' Alive", artist: "Bee Gees", duration: "4:46", genre: "Disco", youtubeId: "I_izvAbhExY" },
  { id: 564, title: "Le Freak", artist: "Chic", duration: "5:30", genre: "Disco", youtubeId: "i3oc1uXSExA" },
  { id: 565, title: "Dancing Queen", artist: "ABBA", duration: "3:51", genre: "Disco", youtubeId: "xFrGuyw1V8s" },
  { id: 566, title: "I Will Survive", artist: "Gloria Gaynor", duration: "3:18", genre: "Disco", youtubeId: "ZBR2G-iI3-I" },
  { id: 567, title: "Get Lucky", artist: "Daft Punk ft. Pharrell", duration: "6:08", genre: "Disco", youtubeId: "5NV6Rdv1a3I" },
  { id: 568, title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", duration: "4:30", genre: "Funk", youtubeId: "OPf0YbXqDm0" },
  { id: 569, title: "24K Magic", artist: "Bruno Mars", duration: "3:47", genre: "Funk", youtubeId: "UqyT8IEBkvY" },

  // FOLK / ACOUSTIC
  { id: 580, title: "The Sound of Silence", artist: "Simon & Garfunkel", duration: "3:08", genre: "Folk", youtubeId: "4fWyzwo1xg0" },
  { id: 581, title: "Blowin' in the Wind", artist: "Bob Dylan", duration: "2:48", genre: "Folk", youtubeId: "MMFj8uDubsE" },
  { id: 582, title: "Like a Rolling Stone", artist: "Bob Dylan", duration: "6:13", genre: "Folk", youtubeId: "IwOfCgkyEj0" },
  { id: 583, title: "Hallelujah", artist: "Leonard Cohen", duration: "4:36", genre: "Folk", youtubeId: "YrLk4vdY28Q" },
  { id: 584, title: "Fast Car", artist: "Tracy Chapman", duration: "4:55", genre: "Folk", youtubeId: "AIXUgtNC4Kc" },
  { id: 585, title: "Heart of Gold", artist: "Neil Young", duration: "3:07", genre: "Folk", youtubeId: "n2MtEsrcTTs" },
  { id: 586, title: "Wish You Were Here", artist: "Pink Floyd", duration: "5:34", genre: "Folk", youtubeId: "IXdNnw99-Ic" },

  // GOSPEL
  { id: 600, title: "Oceans", artist: "Hillsong United", duration: "8:55", genre: "Gospel", youtubeId: "dy9nwe9_xzw" },
  { id: 601, title: "Way Maker", artist: "Sinach", duration: "5:32", genre: "Gospel", youtubeId: "29IxnsqOkmQ" },
  { id: 602, title: "Goodness of God", artist: "Bethel Music", duration: "8:50", genre: "Gospel", youtubeId: "n4Vu5jKL84M" },
  { id: 603, title: "Reckless Love", artist: "Cory Asbury", duration: "5:39", genre: "Gospel", youtubeId: "Sc6SSHuZvQE" }
];

const PrimeMusicHub = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<Track | null>(null);
  const [filter, setFilter] = useState("All");
  const [savedTracks, setSavedTracks] = useState<SavedTrack[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [showPlayer, setShowPlayer] = useState(true);
  const [listeningHistory, setListeningHistory] = useState<ListeningHistory[]>([]);
  const [showPickedForYou, setShowPickedForYou] = useState(false);
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [youtubeResults, setYoutubeResults] = useState<YouTubeSearchResult[]>([]);
  const [trendingMusic, setTrendingMusic] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [downloads, setDownloads] = useState<Map<string, DownloadProgress>>(new Map());
  const [activeTab, setActiveTab] = useState<'library' | 'youtube' | 'trending'>('library');
  const playerRef = useRef<HTMLIFrameElement>(null);

  // IndexedDB setup
  useEffect(() => {
    const initDB = async () => {
      if (typeof window === 'undefined' || !window.indexedDB) return;
      
      const request = indexedDB.open('PrimeMusicDB', 1);
      
      request.onerror = () => console.error('IndexedDB error');
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        loadSavedTracks(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('savedTracks')) {
          const store = db.createObjectStore('savedTracks', { keyPath: 'id' });
          store.createIndex('addedAt', 'addedAt', { unique: false });
        }
      };
    };
    
    initDB();
  }, []);
  
  const loadSavedTracks = (db: IDBDatabase) => {
    const transaction = db.transaction(['savedTracks'], 'readonly');
    const store = transaction.objectStore('savedTracks');
    const request = store.getAll();
    
    request.onsuccess = () => {
      setSavedTracks(request.result || []);
    };
  };
  
  const saveTrack = (track: Track) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    
    const request = indexedDB.open('PrimeMusicDB', 1);
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['savedTracks'], 'readwrite');
      const store = transaction.objectStore('savedTracks');
      
      const savedTrack: SavedTrack = {
        id: `track-${track.id}`,
        trackId: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        genre: track.genre,
        youtubeId: track.youtubeId,
        addedAt: new Date().toISOString(),
        playCount: (track.playCount || 0) + 1,
        lastPlayed: new Date().toISOString()
      };
      
      store.put(savedTrack);
      
      transaction.oncomplete = () => {
        loadSavedTracks(db);
      };
    };
  };
  
  const removeSavedTrack = (trackId: number) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    
    const request = indexedDB.open('PrimeMusicDB', 1);
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['savedTracks'], 'readwrite');
      const store = transaction.objectStore('savedTracks');
      store.delete(`track-${trackId}`);
      
      transaction.oncomplete = () => {
        loadSavedTracks(db);
      };
    };
  };
  
  const isTrackSaved = (trackId: number) => {
    return savedTracks.some(t => t.id === `track-${trackId}`);
  };

  const genres = ["All", "Pop", "Rock", "Hip-Hop", "Funk", "Latin", "Electronic", "R&B", "Jazz", "Classical", "Indie", "Country", "Metal", "Reggae", "Blues", "Saved"];
  const filtered = filter === "Saved" ? savedTracks : tracks.filter(t =>
    (filter === "All" || t.genre === filter) &&
    (t.title.toLowerCase().includes(search.toLowerCase()) || t.artist.toLowerCase().includes(search.toLowerCase()))
  );

  // AI Recommendations using Gemini API
  const generateAIRecommendations = async () => {
    try {
      // Analyze user's listening history
      const favoriteGenres = savedTracks.reduce((acc, track) => {
        acc[track.genre] = (acc[track.genre] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostPlayedTracks = savedTracks
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, 5);
      
      // Generate recommendations based on preferences
      const prompt = `Based on my listening history, I enjoy ${Object.keys(favoriteGenres).join(', ')} music. My most played tracks are: ${mostPlayedTracks.map(t => t.title).join(', ')}. Please recommend 5 similar tracks from the available music library that match my taste. Consider similar artists, genres, and patterns.`;
      
      // Call Gemini API (using Supabase function as proxy)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-recommendations`, {
        method: 'POST',
        headers: {
          Authorization: await authHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          userHistory: savedTracks.map(t => ({ title: t.title, artist: t.artist, genre: t.genre, playCount: t.playCount })),
          availableTracks: tracks
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // For now, we'll use the existing tracks as recommendations
        // In production, this would return AI-generated suggestions
        const recommendedTracks = tracks
          .filter(t => {
            const userGenres = Object.keys(favoriteGenres);
            return userGenres.includes(t.genre) || 
              mostPlayedTracks.some(played => 
                played.genre === t.genre || 
                played.artist.toLowerCase().includes(t.artist.toLowerCase().split(' ')[0])
              );
          })
          .slice(0, 5);
        
        return recommendedTracks;
      }
    } catch (error) {
      console.error('AI recommendations error:', error);
      return tracks.slice(0, 5); // Fallback to top tracks
    }
  };

  const playTrack = (track: Track | SavedTrack) => {
    const t: Track = 'trackId' in track
      ? { id: track.trackId, title: track.title, artist: track.artist, duration: track.duration, genre: track.genre, youtubeId: track.youtubeId }
      : track;
    setPlaying(t);
    setListeningHistory(prev => [{ id: `${t.id}-${Date.now()}`, trackId: t.id, timestamp: new Date().toISOString() }, ...prev].slice(0, 50));
  };


  const nextTrack = () => {
    if (!playing) return;
    const currentTracks = filter === "Saved" ? savedTracks : tracks;
    const idx = currentTracks.findIndex(t => t.id === playing.id);
    let nextIndex = (idx + 1) % currentTracks.length;
    
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * currentTracks.length);
    }
    
    const next = currentTracks[nextIndex];
    if (next) playTrack(next);
  };

  const prevTrack = () => {
    if (!playing) return;
    const currentTracks = filter === "Saved" ? savedTracks : tracks;
    const idx = currentTracks.findIndex(t => t.id === playing.id);
    const prev = currentTracks[(idx - 1 + currentTracks.length) % currentTracks.length];
    if (prev) playTrack(prev);
  };
  
  const toggleRepeat = () => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  // YouTube search functionality
  const handleYouTubeSearch = async () => {
    if (!youtubeSearch.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await youtubeService.searchMusic(youtubeSearch, 50);
      setYoutubeResults(results);
    } catch (error) {
      console.error('YouTube search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Load trending music
  const loadTrendingMusic = async () => {
    try {
      const trending = await youtubeService.getTrendingMusic();
      setTrendingMusic(trending);
    } catch (error) {
      console.error('Trending music error:', error);
    }
  };

  // Download track
  const downloadTrack = async (youtubeResult: YouTubeSearchResult) => {
    const downloadId = `download-${youtubeResult.youtubeId}`;
    
    // Initialize download progress
    setDownloads(prev => new Map(prev.set(downloadId, {
      trackId: downloadId,
      progress: 0,
      status: 'pending'
    })));

    try {
      // Update status to downloading
      setDownloads(prev => {
        const newMap = new Map(prev);
        const download = newMap.get(downloadId);
        if (download) {
          download.status = 'downloading';
        }
        return newMap;
      });

      const blob = await youtubeService.downloadVideo(
        youtubeResult.youtubeId,
        youtubeResult.title,
        (progress) => {
          setDownloads(prev => {
            const newMap = new Map(prev);
            const download = newMap.get(downloadId);
            if (download) {
              download.progress = progress;
            }
            return newMap;
          });
        }
      );

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${youtubeResult.title} - ${youtubeResult.artist}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Mark as completed
      setDownloads(prev => {
        const newMap = new Map(prev);
        const download = newMap.get(downloadId);
        if (download) {
          download.status = 'completed';
          download.progress = 100;
        }
        return newMap;
      });

      // Remove from downloads after 5 seconds
      setTimeout(() => {
        setDownloads(prev => {
          const newMap = new Map(prev);
          newMap.delete(downloadId);
          return newMap;
        });
      }, 5000);

    } catch (error) {
      console.error('Download error:', error);
      setDownloads(prev => {
        const newMap = new Map(prev);
        const download = newMap.get(downloadId);
        if (download) {
          download.status = 'error';
          download.error = 'Download failed';
        }
        return newMap;
      });
    }
  };

  // Play YouTube track
  const playYouTubeTrack = (youtubeResult: YouTubeSearchResult) => {
    const track: Track = {
      id: parseInt(youtubeResult.youtubeId.replace(/[^0-9]/g, '')) || Date.now(),
      title: youtubeResult.title,
      artist: youtubeResult.artist,
      duration: youtubeResult.duration,
      genre: 'YouTube',
      youtubeId: youtubeResult.youtubeId
    };
    
    setPlaying(track);
    setShowPlayer(true);
    saveTrack(track);
  };

  // Load trending music on component mount and tab change
  useEffect(() => {
    if (activeTab === 'trending' && trendingMusic.length === 0) {
      loadTrendingMusic();
    }
  }, [activeTab]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed inset-0 z-[60] bg-background flex flex-col"
        >
          <div className="liquid-glass-elevated safe-area-top">
            <div className="flex items-center justify-between px-5 py-4 relative z-10">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-primary" />
                <span className="text-headline text-foreground text-base">Prime Music</span>
              </div>
              <button onClick={onClose} className="depth-press w-8 h-8 rounded-full liquid-glass-subtle flex items-center justify-center">
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          <div className="px-5 py-3">
            <div className="liquid-glass rounded-2xl flex items-center gap-3 px-4 py-2.5 relative z-10">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search songs or artists..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 px-5 pb-2 overflow-x-auto scrollbar-none">
            {(['library', 'youtube', 'trending'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`depth-press px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1 ${activeTab === tab ? "bg-primary text-primary-foreground" : "liquid-glass-subtle text-foreground relative z-10"}`}
              >
                {tab === 'library' && <Music className="w-3 h-3" />}
                {tab === 'youtube' && <Globe className="w-3 h-3" />}
                {tab === 'trending' && <TrendingUp className="w-3 h-3" />}
                {tab === 'library' && 'Library'}
                {tab === 'youtube' && 'YouTube'}
                {tab === 'trending' && 'Trending'}
              </button>
            ))}
          </div>

          {/* Genre Filters - Only show in library tab */}
          {activeTab === 'library' && (
            <div className="flex gap-2 px-5 pb-2 overflow-x-auto scrollbar-none">
              {genres.map(g => (
                <button
                  key={g}
                  onClick={() => setFilter(g)}
                  className={`depth-press px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap ${filter === g ? "bg-primary text-primary-foreground" : "liquid-glass-subtle text-foreground relative z-10"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* YouTube Search - Only show in youtube tab */}
          {activeTab === 'youtube' && (
            <div className="px-5 pb-2">
              <div className="liquid-glass rounded-2xl flex items-center gap-2 px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  value={youtubeSearch}
                  onChange={e => setYoutubeSearch(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleYouTubeSearch()}
                  placeholder="Search YouTube music..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button
                  onClick={handleYouTubeSearch}
                  disabled={isSearching}
                  className="depth-press px-3 py-1 rounded-xl bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          )}

          {/* Mini Player in Footer */}
          <AnimatePresence>
            {playing && showPlayer && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-24 left-4 right-4 z-[55] w-80"
              >
                <div className="liquid-glass-elevated rounded-2xl p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Music className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{playing.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{playing.artist}</p>
                    </div>
                    <button
                      onClick={() => setShowPlayer(false)}
                      className="depth-press w-8 h-8 rounded-full liquid-glass-subtle flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                  
                  {/* Full YouTube Player */}
                  <AnimatePresence>
                    {showPlayer && playing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-5 overflow-hidden"
                      >
                        <div className="rounded-2xl overflow-hidden aspect-video mb-2 relative">
                          <iframe
                            ref={playerRef}
                            key={playing.youtubeId}
                            src={`https://www.youtube.com/embed/${playing.youtubeId}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0`}
                            title={playing.title}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                          {/* Overlay Controls */}
                          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-black/20 to-black/40 pointer-events-none" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Picked for You Section */}
          <AnimatePresence>
            {showPickedForYou && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed inset-0 z-[65] bg-background/95 backdrop-blur-xl flex items-center justify-center p-6"
                onClick={() => setShowPickedForYou(false)}
              >
                <div className="liquid-glass-elevated rounded-3xl p-6 max-w-md w-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-foreground">🎵</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground mb-2">Picked for You</h3>
                      <p className="text-sm text-muted-foreground mb-4">Based on your listening history, we think you'll love:</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {listeningHistory.slice(0, 6).map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="liquid-glass rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => {
                          const track = tracks.find(t => t.id === item.trackId);
                          if (track) playTrack(track);
                          setShowPickedForYou(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                            <span className="text-primary font-bold">{i + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{tracks.find(t => t.id === item.trackId)?.title || 'Unknown Track'}</p>
                            <p className="text-xs text-muted-foreground">{tracks.find(t => t.id === item.trackId)?.artist || 'Unknown Artist'}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={() => setShowPickedForYou(false)}
                      className="depth-press px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto px-5 py-2 space-y-1.5">
            {/* Library Tab */}
            {activeTab === 'library' && filtered.map((track, i) => (
              <motion.button
                key={track.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => playTrack(track)}
                className={`depth-press w-full rounded-2xl p-3 flex items-center gap-3 relative z-10 ${playing?.id === track.id ? "liquid-glass-elevated" : "liquid-glass-subtle"}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${playing?.id === track.id ? "bg-primary" : "bg-primary/20"}`}>
                  {playing?.id === track.id ? <Pause className="w-4 h-4 text-primary-foreground" /> : <Play className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                  <p className="text-caption text-muted-foreground truncate">{track.artist}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => saveTrack(track)}
                    className="depth-press w-7 h-7 rounded-full liquid-glass-subtle flex items-center justify-center"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isTrackSaved(track.id) ? "text-destructive fill-current" : "text-foreground"}`} />
                  </button>
                  <button
                    onClick={() => track.downloadUrl && window.open(track.downloadUrl, '_blank')}
                    className="depth-press w-7 h-7 rounded-full liquid-glass-subtle flex items-center justify-center"
                    disabled={!track.downloadUrl}
                  >
                    <Download className="w-3.5 h-3.5 text-foreground" />
                  </button>
                  <Youtube className="w-3 h-3 text-destructive" />
                  <span className="text-caption text-muted-foreground">{track.duration}</span>
                </div>
              </motion.button>
            ))}

            {/* YouTube Search Results */}
            {activeTab === 'youtube' && youtubeResults.map((result, i) => {
              const downloadId = `download-${result.youtubeId}`;
              const downloadProgress = downloads.get(downloadId);
              
              return (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="depth-press w-full rounded-2xl p-3 flex items-center gap-3 relative z-10 liquid-glass-subtle"
                >
                  <img src={result.thumbnail} alt={result.title} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                    <p className="text-caption text-muted-foreground truncate">{result.artist}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{result.duration}</span>
                      <span>•</span>
                      <span>{result.viewCount} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playYouTubeTrack(result)}
                      className="depth-press w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <Play className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button
                      onClick={() => downloadTrack(result)}
                      disabled={downloadProgress?.status === 'downloading'}
                      className="depth-press w-7 h-7 rounded-full liquid-glass-subtle flex items-center justify-center relative"
                    >
                      {downloadProgress?.status === 'downloading' ? (
                        <div className="w-3.5 h-3.5 relative">
                          <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                          <div 
                            className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin"
                            style={{ 
                              clipPath: `polygon(0 0, 50% 0, 50% 100%, 0 100%)`,
                              transform: `rotate(${(downloadProgress.progress / 100) * 360}deg)`
                            }}
                          ></div>
                        </div>
                      ) : downloadProgress?.status === 'completed' ? (
                        <DownloadCloud className="w-3.5 h-3.5 text-green-500" />
                      ) : downloadProgress?.status === 'error' ? (
                        <X className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-foreground" />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Trending Music */}
            {activeTab === 'trending' && trendingMusic.map((result, i) => {
              const downloadId = `download-${result.youtubeId}`;
              const downloadProgress = downloads.get(downloadId);
              
              return (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="depth-press w-full rounded-2xl p-3 flex items-center gap-3 relative z-10 liquid-glass-subtle"
                >
                  <div className="relative">
                    <img src={result.thumbnail} alt={result.title} className="w-10 h-10 rounded-xl object-cover" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full flex items-center justify-center">
                      <TrendingUp className="w-2 h-2 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                    <p className="text-caption text-muted-foreground truncate">{result.artist}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{result.duration}</span>
                      <span>•</span>
                      <span>{result.viewCount} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => playYouTubeTrack(result)}
                      className="depth-press w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <Play className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button
                      onClick={() => downloadTrack(result)}
                      disabled={downloadProgress?.status === 'downloading'}
                      className="depth-press w-7 h-7 rounded-full liquid-glass-subtle flex items-center justify-center relative"
                    >
                      {downloadProgress?.status === 'downloading' ? (
                        <div className="w-3.5 h-3.5 relative">
                          <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                          <div 
                            className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin"
                            style={{ 
                              clipPath: `polygon(0 0, 50% 0, 50% 100%, 0 100%)`,
                              transform: `rotate(${(downloadProgress.progress / 100) * 360}deg)`
                            }}
                          ></div>
                        </div>
                      ) : downloadProgress?.status === 'completed' ? (
                        <DownloadCloud className="w-3.5 h-3.5 text-green-500" />
                      ) : downloadProgress?.status === 'error' ? (
                        <X className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-foreground" />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Empty States */}
            {activeTab === 'youtube' && youtubeResults.length === 0 && !isSearching && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Globe className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Search YouTube for unlimited music</p>
                <p className="text-xs text-muted-foreground">Type any song or artist name above</p>
              </div>
            )}

            {activeTab === 'trending' && trendingMusic.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Loading trending music...</p>
              </div>
            )}
          </div>

          {playing && (
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              className="liquid-glass-elevated px-5 py-4 safe-area-bottom"
            >
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{playing.title}</p>
                  <p className="text-caption text-muted-foreground">{playing.artist}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsShuffled(!isShuffled)} 
                    className={`depth-press w-8 h-8 rounded-full flex items-center justify-center ${isShuffled ? "bg-primary" : "liquid-glass-subtle"}`}
                  >
                    <span className="text-xs font-bold text-foreground">🔀</span>
                  </button>
                  <button 
                    onClick={toggleRepeat} 
                    className={`depth-press w-8 h-8 rounded-full flex items-center justify-center ${repeatMode !== 'off' ? "bg-primary" : "liquid-glass-subtle"}`}
                  >
                    <span className="text-xs font-bold text-foreground">{repeatMode === 'one' ? '🔂' : '🔁'}</span>
                  </button>
                  <button className="depth-press" onClick={prevTrack}><SkipBack className="w-5 h-5 text-foreground" /></button>
                  <button
                    className="depth-press w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                    onClick={() => setShowPlayer(!showPlayer)}
                  >
                    {showPlayer ? <Pause className="w-5 h-5 text-primary-foreground" /> : <Play className="w-5 h-5 text-primary-foreground" />}
                  </button>
                  <button className="depth-press" onClick={nextTrack}><SkipForward className="w-5 h-5 text-foreground" /></button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PrimeMusicHub;
