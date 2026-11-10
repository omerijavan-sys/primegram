import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trophy, ArrowUpDown, Timer, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LiquidBackground from "@/components/LiquidBackground";

// TheSportsDB free public test key
const TSD = "https://www.thesportsdb.com/api/v1/json/3";
const LEAGUES = {
  EPL: { id: 4328, season: "2024-2025" },
  LALIGA: { id: 4335, season: "2024-2025" },
  UCL: { id: 4480, season: "2024-2025" },
  NBA: { id: 4387, season: "2024-2025" },
};

type LiveMatch = { home: string; away: string; scoreH: string | number; scoreA: string | number; time: string; league: string };
type TableRow = { pos: number; team: string; p: number; w: number; d: number; l: number; gd: number; pts: number };

const SportsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"live" | "epl" | "laliga" | "ucl" | "nba" | "f1" | "transfers">("live");
  const [live, setLive] = useState<LiveMatch[]>([]);
  const [tables, setTables] = useState<Record<string, TableRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const fetchLive = async () => {
    try {
      const ids = [LEAGUES.EPL.id, LEAGUES.LALIGA.id, LEAGUES.UCL.id, LEAGUES.NBA.id];
      const labels = ["EPL", "La Liga", "UCL", "NBA"];
      const all: LiveMatch[] = [];
      await Promise.all(
        ids.map(async (id, i) => {
          try {
            const res = await fetch(`${TSD}/eventspastleague.php?id=${id}`);
            const data = await res.json();
            const events = (data?.events || []).slice(0, 3);
            events.forEach((e: any) => {
              all.push({
                home: e.strHomeTeam || "TBD",
                away: e.strAwayTeam || "TBD",
                scoreH: e.intHomeScore ?? "-",
                scoreA: e.intAwayScore ?? "-",
                time: e.strStatus === "Match Finished" ? "FT" : (e.dateEvent || "TBD"),
                league: labels[i],
              });
            });
          } catch {}
        }),
      );
      if (all.length > 0) setLive(all);
    } catch (e) {
      console.warn("Sports fetch error", e);
    }
  };

  const fetchTable = async (key: keyof typeof LEAGUES) => {
    try {
      const { id, season } = LEAGUES[key];
      const res = await fetch(`${TSD}/lookuptable.php?l=${id}&s=${season}`);
      const data = await res.json();
      const rows: TableRow[] = (data?.table || []).slice(0, 12).map((r: any, i: number) => ({
        pos: parseInt(r.intRank ?? `${i + 1}`, 10),
        team: r.strTeam,
        p: parseInt(r.intPlayed ?? "0", 10),
        w: parseInt(r.intWin ?? "0", 10),
        d: parseInt(r.intDraw ?? "0", 10),
        l: parseInt(r.intLoss ?? "0", 10),
        gd: parseInt(r.intGoalDifference ?? "0", 10),
        pts: parseInt(r.intPoints ?? "0", 10),
      }));
      if (rows.length > 0) setTables((prev) => ({ ...prev, [key]: rows }));
    } catch (e) {
      console.warn("Table fetch error", key, e);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchLive(),
      fetchTable("EPL"),
      fetchTable("LALIGA"),
      fetchTable("UCL"),
      fetchTable("NBA"),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      fetchLive();
      setRefreshTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const transfers = [
    { player: "Kylian Mbappé", from: "PSG", to: "Real Madrid", fee: "Free" },
    { player: "Julian Alvarez", from: "Man City", to: "Atletico Madrid", fee: "€75M" },
    { player: "Dani Olmo", from: "RB Leipzig", to: "Barcelona", fee: "€55M" },
    { player: "Joshua Zirkzee", from: "Bologna", to: "Man United", fee: "€42M" },
    { player: "Pedro Neto", from: "Wolves", to: "Chelsea", fee: "€60M" },
    { player: "Leny Yoro", from: "Lille", to: "Man United", fee: "€62M" },
  ];

  const f1Standings = [
    { pos: 1, driver: "Max Verstappen", team: "Red Bull", pts: 575 },
    { pos: 2, driver: "Lando Norris", team: "McLaren", pts: 374 },
    { pos: 3, driver: "Charles Leclerc", team: "Ferrari", pts: 356 },
    { pos: 4, driver: "Oscar Piastri", team: "McLaren", pts: 292 },
    { pos: 5, driver: "Carlos Sainz", team: "Ferrari", pts: 290 },
    { pos: 6, driver: "Lewis Hamilton", team: "Mercedes", pts: 223 },
  ];

  const tabs = [
    { key: "live" as const, label: "🔴 Live" },
    { key: "epl" as const, label: "EPL" },
    { key: "laliga" as const, label: "La Liga" },
    { key: "ucl" as const, label: "UCL" },
    { key: "nba" as const, label: "NBA" },
    { key: "f1" as const, label: "F1" },
    { key: "transfers" as const, label: "Transfers" },
  ];

  const renderTable = (rows: TableRow[]) => (
    <div className="overflow-x-auto">
      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">Loading standings…</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-caption">
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Team</th>
              <th className="p-2">P</th>
              <th className="p-2">W</th>
              <th className="p-2">D</th>
              <th className="p-2">L</th>
              <th className="p-2">GD</th>
              <th className="p-2 font-bold text-foreground">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr key={row.team + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className={`border-t border-border/20 ${i < 4 ? "text-foreground" : "text-foreground/70"}`}>
                <td className="p-2 font-medium">{row.pos}</td>
                <td className="p-2 font-medium">{row.team}</td>
                <td className="p-2 text-center">{row.p}</td>
                <td className="p-2 text-center">{row.w}</td>
                <td className="p-2 text-center">{row.d}</td>
                <td className="p-2 text-center">{row.l}</td>
                <td className="p-2 text-center">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                <td className="p-2 text-center font-bold">{row.pts}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative">
      <LiquidBackground />
      <div className="liquid-glass-elevated safe-area-top relative z-10">
        <div className="flex items-center gap-3 px-5 py-4 relative z-10">
          <button onClick={() => navigate(-1)} className="depth-press"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <Trophy className="w-5 h-5 text-primary" />
          <span className="text-headline text-foreground text-base flex-1">Sports Hub</span>
          <button onClick={() => { fetchLive(); setRefreshTick(t => t + 1); }} className="depth-press">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none relative z-10">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`depth-press px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${tab === t.key ? "bg-primary text-primary-foreground" : "liquid-glass text-foreground relative z-10"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {tab === "live" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-sm font-semibold text-foreground">Recent & Live</span>
                  <span className="ml-auto text-caption text-muted-foreground">Live · TheSportsDB · {refreshTick}</span>
                </div>
                {loading && live.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">Loading matches…</p>
                ) : (
                  live.map((match, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="liquid-glass-elevated rounded-2xl p-4 relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-caption text-primary font-semibold">{match.league}</span>
                        <span className="flex items-center gap-1 text-caption text-destructive font-semibold">
                          <Timer className="w-3 h-3" />{match.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right">
                          <p className="text-sm font-semibold text-foreground">{match.home}</p>
                        </div>
                        <div className="px-4 py-1.5 mx-3 rounded-xl bg-primary/20 min-w-[70px] text-center">
                          <span className="text-lg font-bold text-primary">{match.scoreH} - {match.scoreA}</span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-foreground">{match.away}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {tab === "epl" && <div className="liquid-glass rounded-2xl p-3 relative z-10">{renderTable(tables.EPL || [])}</div>}
            {tab === "laliga" && <div className="liquid-glass rounded-2xl p-3 relative z-10">{renderTable(tables.LALIGA || [])}</div>}
            {tab === "ucl" && <div className="liquid-glass rounded-2xl p-3 relative z-10">{renderTable(tables.UCL || [])}</div>}
            {tab === "nba" && <div className="liquid-glass rounded-2xl p-3 relative z-10">{renderTable(tables.NBA || [])}</div>}

            {tab === "f1" && (
              <div className="liquid-glass rounded-2xl p-3 relative z-10 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-caption">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Driver</th>
                      <th className="text-left p-2">Team</th>
                      <th className="p-2 font-bold text-foreground">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {f1Standings.map((row, i) => (
                      <motion.tr key={row.driver} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-t border-border/20 text-foreground">
                        <td className="p-2 font-medium">{row.pos}</td>
                        <td className="p-2 font-medium">{row.driver}</td>
                        <td className="p-2 text-muted-foreground">{row.team}</td>
                        <td className="p-2 text-center font-bold">{row.pts}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "transfers" && (
              <div className="space-y-2">
                {transfers.map((t, i) => (
                  <motion.div key={t.player} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="liquid-glass rounded-2xl p-4 relative z-10">
                    <p className="text-sm font-semibold text-foreground">{t.player}</p>
                    <div className="flex items-center gap-2 mt-1 text-caption text-muted-foreground">
                      <span>{t.from}</span><ArrowUpDown className="w-3 h-3" /><span>{t.to}</span>
                      <span className="ml-auto text-primary font-medium">{t.fee}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SportsPage;
