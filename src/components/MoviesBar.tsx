import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, X, Star, Play } from "lucide-react";

const movies = [
  { title: "The Shawshank Redemption", year: 1994, genre: "Drama", rating: 9.3, poster: "🎬" },
  { title: "The Godfather", year: 1972, genre: "Crime", rating: 9.2, poster: "🎭" },
  { title: "The Dark Knight", year: 2008, genre: "Action", rating: 9.0, poster: "🦇" },
  { title: "Pulp Fiction", year: 1994, genre: "Crime", rating: 8.9, poster: "💊" },
  { title: "Forrest Gump", year: 1994, genre: "Drama", rating: 8.8, poster: "🏃" },
  { title: "Inception", year: 2010, genre: "Sci-Fi", rating: 8.8, poster: "🌀" },
  { title: "The Matrix", year: 1999, genre: "Sci-Fi", rating: 8.7, poster: "💻" },
  { title: "Interstellar", year: 2014, genre: "Sci-Fi", rating: 8.7, poster: "🚀" },
  { title: "Parasite", year: 2019, genre: "Thriller", rating: 8.5, poster: "🏠" },
  { title: "Oppenheimer", year: 2023, genre: "Drama", rating: 8.3, poster: "💥" },
  { title: "Avengers: Endgame", year: 2019, genre: "Action", rating: 8.4, poster: "🛡️" },
  { title: "Spider-Man: No Way Home", year: 2021, genre: "Action", rating: 8.2, poster: "🕷️" },
  { title: "Dune: Part Two", year: 2024, genre: "Sci-Fi", rating: 8.5, poster: "🏜️" },
  { title: "John Wick 4", year: 2023, genre: "Action", rating: 7.7, poster: "🔫" },
  { title: "Top Gun: Maverick", year: 2022, genre: "Action", rating: 8.2, poster: "✈️" },
];

const MoviesBar = () => {
  const [selectedMovie, setSelectedMovie] = useState<typeof movies[0] | null>(null);

  return (
    <>
      <div className="overflow-x-auto scrollbar-none py-3 px-4">
        <div className="flex gap-3">
          {movies.map((movie, i) => (
            <motion.button
              key={movie.title}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedMovie(movie)}
              className="flex flex-col items-center gap-1.5 min-w-[4.5rem] depth-press"
            >
              <div className="w-16 h-16 rounded-full liquid-glass flex items-center justify-center p-[2px]"
                style={{ background: "linear-gradient(135deg, hsl(350,80%,58%), hsl(280,70%,55%))" }}
              >
                <div className="w-full h-full rounded-full bg-background p-[2px]">
                  <div className="w-full h-full rounded-full liquid-glass flex items-center justify-center">
                    <span className="text-lg relative z-10">{movie.poster}</span>
                  </div>
                </div>
              </div>
              <span className="text-caption text-foreground/70 truncate w-full text-center text-[10px]">{movie.title.split(":")[0].slice(0, 10)}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedMovie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-background/90 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setSelectedMovie(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="liquid-glass-elevated rounded-3xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl liquid-glass flex items-center justify-center text-3xl">
                  {selectedMovie.poster}
                </div>
                <button onClick={() => setSelectedMovie(null)} className="depth-press w-8 h-8 rounded-full liquid-glass-subtle flex items-center justify-center">
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1 relative z-10">{selectedMovie.title}</h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 relative z-10">
                <span>{selectedMovie.year}</span>
                <span>{selectedMovie.genre}</span>
                <span className="flex items-center gap-1 text-primary"><Star className="w-3 h-3" />{selectedMovie.rating}</span>
              </div>
              <button className="depth-press w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Watch Trailer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MoviesBar;
