// Hard-coded Movie Hub catalog.
// Used as an offline / fallback library so the Movie Hub is never empty,
// even when the TMDB proxy is unreachable or rate limited.

export interface CatalogMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
  trailerKey?: string;
  lists: Array<"trending" | "top_rated" | "upcoming">;
}

const m = (
  id: number,
  title: string,
  release_date: string,
  vote_average: number,
  genre_ids: number[],
  overview: string,
  lists: CatalogMovie["lists"],
  trailerKey?: string,
): CatalogMovie => ({
  id,
  title,
  overview,
  poster_path: null,
  backdrop_path: null,
  vote_average,
  release_date,
  genre_ids,
  trailerKey,
  lists,
});

export const MOVIE_CATALOG: CatalogMovie[] = [
  m(27205, "Inception", "2010-07-16", 8.4, [28, 878, 53], "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.", ["trending", "top_rated"], "YoHD9XEInc0"),
  m(157336, "Interstellar", "2014-11-07", 8.4, [12, 18, 878], "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", ["trending", "top_rated"], "zSWdZVtXT7E"),
  m(155, "The Dark Knight", "2008-07-18", 8.5, [28, 80, 18], "Batman raises the stakes in his war on crime and faces the Joker, a criminal mastermind bent on chaos.", ["trending", "top_rated"], "EXeTwQWrcwY"),
  m(603, "The Matrix", "1999-03-31", 8.2, [28, 878], "A hacker discovers the shocking truth about his reality and his role in the war against its controllers.", ["top_rated"], "vKQi3bBA1y8"),
  m(680, "Pulp Fiction", "1994-09-10", 8.5, [80, 53], "The lives of two mob hitmen, a boxer and a gangster's wife intertwine in four tales of violence and redemption.", ["top_rated"], "s7EdQ4FqbhY"),
  m(238, "The Godfather", "1972-03-14", 8.7, [18, 80], "The aging patriarch of an organized crime dynasty transfers control of his empire to his reluctant son.", ["top_rated"], "sY1S34973zA"),
  m(278, "The Shawshank Redemption", "1994-09-23", 8.7, [18, 80], "Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.", ["top_rated"], "6hB3S9bIaco"),
  m(550, "Fight Club", "1999-10-15", 8.4, [18, 53], "An insomniac office worker and a soap salesman form an underground fight club that evolves into much more.", ["top_rated"], "SUXWAEX2jlg"),
  m(13, "Forrest Gump", "1994-07-06", 8.5, [18, 35, 10749], "The story of decades of American history from the perspective of an Alabama man with a big heart.", ["top_rated"], "bLvqoHBptjg"),
  m(769, "Goodfellas", "1990-09-12", 8.5, [18, 80], "The story of Henry Hill and his life in the mob, covering his relationship with his wife and his partners.", ["top_rated"], "2ilzidi_J8Q"),
  m(424, "Schindler's List", "1993-12-15", 8.6, [18, 36, 10752], "In German-occupied Poland, Oskar Schindler gradually becomes concerned for his Jewish workforce.", ["top_rated"], "gG22XNhtnoY"),
  m(11, "Star Wars: A New Hope", "1977-05-25", 8.2, [12, 28, 878], "Luke Skywalker joins forces with a Jedi Knight and a cocky pilot to save the galaxy from the Empire.", ["top_rated"], "vZ734NWnAHA"),
  m(120, "The Lord of the Rings: The Fellowship of the Ring", "2001-12-18", 8.4, [12, 14, 28], "A hobbit and eight companions set out on a journey to destroy the One Ring.", ["top_rated"], "V75dMMIW2B4"),
  m(122, "The Lord of the Rings: The Return of the King", "2003-12-17", 8.5, [12, 14, 28], "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam.", ["top_rated"], "r5X-hFf6Bwo"),
  m(1891, "The Empire Strikes Back", "1980-05-20", 8.4, [12, 28, 878], "After the Rebels are brutally overpowered on Hoth, Luke begins Jedi training with Yoda.", ["top_rated"], "JNwNXF9Y6kY"),
  m(129, "Spirited Away", "2001-07-20", 8.5, [16, 14, 12], "A young girl wanders into a world of spirits and must work to free herself and her parents.", ["top_rated"], "ByXuk9QqQkk"),
  m(496243, "Parasite", "2019-05-30", 8.5, [35, 53, 18], "Greed and class discrimination threaten the newly formed symbiotic relationship between two families.", ["top_rated"], "5xH0HfJHsaY"),
  m(475557, "Joker", "2019-10-02", 8.2, [80, 53, 18], "A mentally troubled comedian embarks on a downward spiral that leads to the birth of an icon.", ["trending", "top_rated"], "zAGVQLHvwOY"),
  m(299534, "Avengers: Endgame", "2019-04-24", 8.3, [12, 878, 28], "The Avengers assemble once more to reverse Thanos' actions and restore balance to the universe.", ["trending"], "TcMBFSGVi1c"),
  m(299536, "Avengers: Infinity War", "2018-04-25", 8.3, [12, 878, 28], "The Avengers must stop Thanos from collecting all the Infinity Stones.", ["trending"], "6ZfuNTqbHE8"),
  m(76600, "Avatar: The Way of Water", "2022-12-14", 7.6, [878, 12, 28], "Jake Sully and Neytiri must protect their family when an ancient threat resurfaces on Pandora.", ["trending"], "d9MyW72ELq0"),
  m(19995, "Avatar", "2009-12-15", 7.6, [28, 12, 878], "A paraplegic Marine dispatched to the moon Pandora becomes torn between two worlds.", ["trending"], "5PSNL1qE6VY"),
  m(361743, "Top Gun: Maverick", "2022-05-24", 8.2, [28, 18], "After thirty years, Maverick trains a detachment of graduates for a specialized mission.", ["trending"], "qSqVVswa420"),
  m(872585, "Oppenheimer", "2023-07-19", 8.1, [18, 36], "The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.", ["trending", "top_rated"], "uYPbbksJxIg"),
  m(346698, "Barbie", "2023-07-19", 7.0, [35, 12, 14], "Barbie and Ken leave the perfection of Barbie Land for the real world.", ["trending"], "pBk4NYhWNMM"),
  m(693134, "Dune: Part Two", "2024-02-27", 8.2, [878, 12], "Paul Atreides unites with the Fremen to wage war against the conspirators who destroyed his family.", ["trending", "top_rated"], "Way9Dexny3w"),
  m(438631, "Dune", "2021-09-15", 7.8, [878, 12], "A noble family becomes embroiled in a war for control over the galaxy's most valuable asset.", ["trending"], "n9xhJrPXop4"),
  m(447365, "Guardians of the Galaxy Vol. 3", "2023-05-03", 8.0, [878, 12, 35], "Peter Quill rallies his team to defend the universe and protect one of their own.", ["trending"], "u3V5KDHRQvk"),
  m(569094, "Spider-Man: Across the Spider-Verse", "2023-05-31", 8.4, [16, 28, 12], "Miles Morales catapults across the multiverse and clashes with the Spider Society.", ["trending", "top_rated"], "cqGjhVJWtEg"),
  m(324857, "Spider-Man: Into the Spider-Verse", "2018-12-06", 8.4, [16, 28, 12], "Teen Miles Morales becomes Spider-Man and joins with five spider-powered heroes.", ["top_rated"], "g4Hbz2jLxvQ"),
  m(634649, "Spider-Man: No Way Home", "2021-12-15", 8.0, [28, 12, 878], "Peter Parker asks Doctor Strange for help when his identity is revealed.", ["trending"], "JfVOs4VSpmA"),
  m(505642, "Black Panther: Wakanda Forever", "2022-11-09", 7.3, [28, 12, 18], "Wakanda fights to protect their nation in the wake of King T'Challa's death.", ["trending"], "_Z3QKkl1WyM"),
  m(507086, "Jurassic World Dominion", "2022-06-01", 6.7, [878, 12, 28], "Dinosaurs now live and hunt alongside humans all over the world.", ["trending"], "fb5ELWi-ekk"),
  m(329, "Jurassic Park", "1993-06-11", 8.0, [12, 878, 53], "A pragmatic paleontologist visits an island theme park populated by cloned dinosaurs.", ["top_rated"], "lc0UehYemQA"),
  m(85, "Raiders of the Lost Ark", "1981-06-12", 7.9, [12, 28], "Indiana Jones races against Nazi forces to find the mystical Ark of the Covenant.", ["top_rated"], "0xQSIdSRlAk"),
  m(578, "Jaws", "1975-06-20", 7.6, [53, 27], "A giant great white shark terrorizes a New England beach town.", ["top_rated"], "U1fu_sA7XhE"),
  m(601, "E.T. the Extra-Terrestrial", "1982-06-11", 7.5, [878, 12, 10751], "A troubled child summons the courage to help a friendly alien escape and return home.", ["top_rated"], "qYAETtIIClk"),
  m(78, "Blade Runner", "1982-06-25", 7.9, [878, 18, 53], "A blade runner must pursue and terminate four replicants who stole a ship in space.", ["top_rated"], "eogpIG53Cis"),
  m(335984, "Blade Runner 2049", "2017-10-04", 7.6, [878, 18], "A young blade runner's discovery of a long-buried secret sends him on a quest.", ["top_rated"], "gCcx85zbxz4"),
  m(76341, "Mad Max: Fury Road", "2015-05-13", 7.6, [28, 12, 878], "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler.", ["trending", "top_rated"], "hEJnMQG9ev8"),
  m(1726, "Iron Man", "2008-04-30", 7.6, [28, 878, 12], "Tony Stark builds a high-tech suit of armor and becomes Iron Man.", ["trending"], "8ugaeA-nMTc"),
  m(1124, "The Prestige", "2006-10-19", 8.2, [18, 9648, 53], "Two rival magicians engage in a bitter battle for supremacy.", ["top_rated"], "o4gHCmTQDVI"),
  m(1422, "The Departed", "2006-10-05", 8.2, [18, 53, 80], "An undercover cop and a mole in the police attempt to identify each other.", ["top_rated"], "auYbpnEwBBg"),
  m(637, "Life Is Beautiful", "1997-12-20", 8.5, [18, 35], "A Jewish father uses humor to protect his son in a Nazi concentration camp.", ["top_rated"], "yByYWDrEuXk"),
  m(497, "The Green Mile", "1999-12-10", 8.5, [14, 18, 80], "A death row officer discovers one of his inmates has a miraculous gift.", ["top_rated"], "Ki4haFrqSrw"),
  m(311, "Once Upon a Time in America", "1984-05-23", 8.4, [18, 80], "A former Prohibition-era gangster returns to confront the ghosts of his past.", ["top_rated"], "n4dnEHt-JGM"),
  m(510, "One Flew Over the Cuckoo's Nest", "1975-11-19", 8.4, [18], "A criminal pleads insanity and is admitted to a mental institution.", ["top_rated"], "OXwqHhQFmU8"),
  m(389, "12 Angry Men", "1957-04-10", 8.5, [18], "A jury holdout attempts to prevent a miscarriage of justice.", ["top_rated"], "_13J_9B5jEk"),
  m(274, "The Silence of the Lambs", "1991-02-14", 8.3, [80, 18, 53], "A young FBI cadet must confide in an incarcerated killer to catch another.", ["top_rated"], "6iB21hsprAQ"),
  m(1585, "It's a Wonderful Life", "1946-12-20", 8.2, [18, 14, 10751], "An angel shows a frustrated businessman how much his life truly mattered.", ["top_rated"], "Mr0Q_2u9Hqo"),
  m(1032823, "Trap", "2024-08-02", 6.4, [53, 27], "A father and daughter attend a pop concert that turns into a manhunt.", ["upcoming"], "hJiPAJKjUVg"),
  m(533535, "Deadpool & Wolverine", "2024-07-24", 7.7, [28, 35, 878], "Deadpool drags a reluctant Wolverine across the multiverse to save his world.", ["trending", "upcoming"], "73_1biulkYk"),
  m(519182, "Despicable Me 4", "2024-06-20", 7.1, [16, 35, 10751], "Gru faces a new nemesis while adjusting to life with a new family member.", ["upcoming"], "qQlr9-Vqjcw"),
  m(718821, "Twisters", "2024-07-10", 7.0, [28, 12, 53], "Storm chasers test a groundbreaking new tracking system in tornado alley.", ["upcoming"], "gc0mDlYOK1s"),
  m(1022789, "Inside Out 2", "2024-06-11", 7.6, [16, 10751, 35], "Riley's mind headquarters faces a demolition to make room for new emotions.", ["trending", "upcoming"], "LEjhY15eCx0"),
  m(823464, "Godzilla x Kong: The New Empire", "2024-03-27", 7.1, [28, 878, 12], "Two ancient titans collide and unite against a colossal undiscovered threat.", ["upcoming"], "lF5x_XVA-yA"),
  m(748783, "The Garfield Movie", "2024-05-01", 6.6, [16, 35, 10751], "Garfield reunites with his long-lost father for a high-stakes heist.", ["upcoming"], "ByObAkjRoIA"),
  m(786892, "Furiosa: A Mad Max Saga", "2024-05-22", 7.6, [28, 12, 878], "Young Furiosa is snatched from the Green Place and must survive the Wasteland.", ["upcoming"], "XJMuhwVlca4"),
  m(1011985, "Kung Fu Panda 4", "2024-03-02", 7.1, [16, 28, 35], "Po must train a new Dragon Warrior while facing a shape-shifting sorceress.", ["upcoming"], "_inKs4eeHiI"),
  m(573435, "Bad Boys: Ride or Die", "2024-06-05", 7.1, [28, 35, 53], "Mike and Marcus go on the run to clear their late captain's name.", ["upcoming"], "hMANIarjT50"),
];

export const catalogByList = (list: "trending" | "top_rated" | "upcoming"): CatalogMovie[] =>
  MOVIE_CATALOG.filter((mv) => mv.lists.includes(list));

export const searchCatalog = (query: string): CatalogMovie[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOVIE_CATALOG.filter(
    (mv) => mv.title.toLowerCase().includes(q) || mv.overview.toLowerCase().includes(q),
  );
};

export const catalogTrailerKey = (id: number, title: string): string | undefined =>
  MOVIE_CATALOG.find((mv) => mv.id === id || mv.title.toLowerCase() === title.toLowerCase())?.trailerKey;
