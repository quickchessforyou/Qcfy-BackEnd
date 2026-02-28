import React, { useMemo, useCallback } from "react";
import { useLiveCompetition } from "../../contexts/LiveCompetitionContext";
import { useAuth } from "../../contexts/AuthContext";
import "./PuzzleRacer.css";

/* ========================================================
   ALL 8 PLANETS – Mercury to Neptune (+ Sun as rank #1)
======================================================== */
const PLANET_DATA = [
  // Order: farthest from Sun (left) → closest to Sun (right)
  { key: "neptune", label: "Neptune", size: 42, color1: "#5588ff", color2: "#3366ee", color3: "#2244cc", color4: "#1122aa", glow: "rgba(60,110,255,0.5)" },
  { key: "uranus", label: "Uranus", size: 44, color1: "#55eeff", color2: "#22ccdd", color3: "#11aabb", color4: "#008899", glow: "rgba(50,220,240,0.45)" },
  { key: "saturn", label: "Saturn", size: 55, color1: "#ffe4a0", color2: "#eebb55", color3: "#cc9933", color4: "#aa7722", glow: "rgba(238,190,90,0.4)", hasRing: true },
  { key: "jupiter", label: "Jupiter", size: 65, color1: "#ffbb77", color2: "#ee9944", color3: "#cc7733", color4: "#995522", glow: "rgba(238,160,80,0.45)", hasBands: true },
  { key: "mars", label: "Mars", size: 32, color1: "#ff6633", color2: "#dd3311", color3: "#bb1100", color4: "#880000", glow: "rgba(255,60,20,0.45)" },
  { key: "earth", label: "Earth", size: 40, color1: "#55ccff", color2: "#2299ee", color3: "#1177cc", color4: "#0055aa", glow: "rgba(50,170,255,0.5)", hasLand: true },
  { key: "venus", label: "Venus", size: 38, color1: "#ff9933", color2: "#e87722", color3: "#cc5511", color4: "#993300", glow: "rgba(255,140,40,0.5)" },
  { key: "mercury", label: "Mercury", size: 28, color1: "#e0d6cc", color2: "#c4b8a8", color3: "#9e8e78", color4: "#706050", glow: "rgba(200,185,165,0.4)" },
];

const VISIBLE_SLOTS = 9; // 1 sun + 8 planets

/* ========================================================
   COMPONENT
======================================================== */
const PuzzleRacer = () => {
  const { leaderboard, competition, participant, puzzles: contextPuzzles, getSolvedPuzzlesCount } = useLiveCompetition();
  const { user } = useAuth();

  const totalPuzzles = useMemo(() => {
    if (competition?.puzzles?.length) return competition.puzzles.length;
    if (contextPuzzles?.length) return contextPuzzles.length;
    return 10;
  }, [competition, contextPuzzles]);

  // Ground-truth solved count — prioritize participant.puzzlesSolved (updated instantly
  // via updateParticipant() from PuzzlePage on every successful solve), fall back to
  // counting solved puzzles in the context array.
  const localSolvedCount = useMemo(() => {
    // participant.puzzlesSolved is updated immediately by PuzzlePage via updateParticipant()
    if (participant?.puzzlesSolved != null && participant.puzzlesSolved > 0) {
      return participant.puzzlesSolved;
    }
    // Fallback: count from context puzzles array (populated by loadCompetitionPuzzles)
    if (contextPuzzles?.length > 0) {
      return contextPuzzles.filter(p => p.isSolved).length;
    }
    return 0;
  }, [participant, contextPuzzles]);

  const currentUserId = user ? user.id || user._id : null;

  const isCurrentUser = useCallback(
    (racer) => {
      if (!racer || !user) return false;
      return racer.userId === currentUserId || racer.username === user?.username;
    },
    [currentUserId, user]
  );

  // Build sorted racer list – current user's score always reads from local ground truth
  const racers = useMemo(() => {
    let displayList = [];

    if (leaderboard?.length > 0) {
      displayList = leaderboard.map((p) => {
        if (currentUserId && (p.userId === currentUserId || p.username === user?.username)) {
          return {
            ...p,
            score: Math.max(p.score || 0, participant?.score || 0),
            // Use local puzzle count as ground truth — avoids stale server value
            puzzlesSolved: Math.max(p.puzzlesSolved || 0, localSolvedCount),
          };
        }
        return p;
      });
      displayList.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    }

    // If current user not in leaderboard yet, add them with local data
    if (currentUserId) {
      const inList = displayList.find(
        (p) => p.userId === currentUserId || p.username === user?.username
      );
      if (!inList && user) {
        displayList.push({
          userId: currentUserId,
          username: user.username || user.name || "You",
          rank: 999,
          score: participant?.score || 0,
          puzzlesSolved: localSolvedCount,
        });
      }
    }

    return displayList.sort((a, b) => (a.rank || 999) - (b.rank || 999));
  }, [leaderboard, user, participant, currentUserId, localSolvedCount]);

  // Sun = rank 1, planets = ranks 2-9
  const sunRacer = racers[0] || null;
  const planetSlots = PLANET_DATA.map((planet, i) => {
    const racerIndex = PLANET_DATA.length - i;
    return {
      planet,
      racer: racers[racerIndex] || null,
      rank: racerIndex + 1,
    };
  });

  const currentUserInSlots = racers.slice(0, VISIBLE_SLOTS).some(
    (r) => r && (r.userId === currentUserId || r.username === user?.username)
  );

  const currentUserRacer = racers.find(
    (r) => r.userId === currentUserId || r.username === user?.username
  );

  const othersCount = Math.max(0, racers.length - VISIBLE_SLOTS);

  return (
    <div className="puzzle-racer-container">
      {/* Header */}
      <div className="racer-header">
        <h4>
          <span className="race-icon">🪐</span>
          Puzzle Galaxy
        </h4>
        <div className="race-info">
          <span className="puzzle-count">{totalPuzzles} Puzzles</span>
          {othersCount > 0 && (
            <span className="others-badge">
              <span className="others-icon">🌟</span>
              +{othersCount} more
            </span>
          )}
        </div>
      </div>

      {/* Solar System Visual */}
      <div className="solar-system-scene">
        {/* Orbit ellipses anchored at sun position */}
        <svg className="orbit-svg" viewBox="0 0 1000 260" preserveAspectRatio="none">
          {[130, 175, 220, 265, 310, 355, 400, 445].map((rx, i) => (
            <ellipse
              key={i}
              cx="940"
              cy="130"
              rx={rx}
              ry={rx * 0.38}
              fill="none"
              stroke="rgba(255,255,255,0.045)"
              strokeWidth="1"
            />
          ))}
        </svg>

        {/* Comet decorations */}
        <div className="comet comet-1" />
        <div className="comet comet-2" />

        {/* Planets area */}
        <div className="planets-lineup">
          {planetSlots.map(({ planet, racer, rank }, idx) => {
            const isCurrent = racer && isCurrentUser(racer);
            // Use local ground truth for current user
            const solved = isCurrent ? localSolvedCount : (racer?.puzzlesSolved || 0);

            return (
              <div
                key={planet.key}
                className={`planet-slot ${isCurrent ? "planet-slot-you" : ""} ${!racer ? "planet-slot-empty" : ""}`}
                style={{ animationDelay: `${idx * 0.4}s` }}
              >
                {/* The sphere */}
                <div
                  className={`planet-orb planet-float-${idx + 1} ${isCurrent ? "planet-orb-you" : ""}`}
                  style={{
                    width: `${planet.size}px`,
                    height: `${planet.size}px`,
                    background: `radial-gradient(circle at 35% 35%, ${planet.color1}, ${planet.color2} 40%, ${planet.color3} 75%, ${planet.color4})`,
                    boxShadow: isCurrent
                      ? `0 0 ${planet.size * 0.5}px ${planet.glow}, 0 0 ${planet.size}px rgba(120,200,255,0.25), 0 0 3px rgba(255,255,255,0.6)`
                      : `0 0 ${planet.size * 0.4}px ${planet.glow}, 0 0 ${planet.size * 0.8}px ${planet.glow.replace(/[\d.]+\)$/, '0.1)')}`,
                  }}
                >
                  {planet.hasRing && <div className="saturn-ring" />}
                  {planet.hasBands && <div className="jupiter-bands" />}
                  {planet.hasLand && <div className="earth-land" />}
                  <div className="planet-shine" />
                  {/* Crown badge for rank 1 on planet */}
                  {rank === 1 && racer && <span className="planet-crown">👑</span>}
                </div>

                {/* Score bar */}
                {racer && (
                  <div className="planet-progress-wrap">
                    <div
                      className="planet-progress-bar"
                      style={{ width: `${(solved / totalPuzzles) * 100}%`, background: isCurrent ? 'linear-gradient(90deg,#4fc3f7,#81d4fa)' : 'rgba(255,255,255,0.2)' }}
                    />
                  </div>
                )}

                {/* Label below */}
                <div className="planet-slot-label">
                  {racer ? (
                    <>
                      <span className={`planet-slot-name ${isCurrent ? "name-you" : ""}`}>
                        {isCurrent ? "⭐ You" : racer.username}
                      </span>
                      <span className={`planet-slot-score ${isCurrent ? "score-you" : ""}`}>
                        {solved}/{totalPuzzles}
                      </span>
                    </>
                  ) : (
                    <span className="planet-slot-planet-name">{planet.label}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sun (right side) */}
        <div className="sun-region">
          <div className="sun-corona" />
          <div className="sun-outer-glow" />
          {sunRacer && <span className="sun-crown-icon">👑</span>}
          <div className="sun-body" />

          <div className="sun-label">
            {sunRacer ? (
              <>
                <span className="sun-player-name">
                  {isCurrentUser(sunRacer) ? "⭐ You" : sunRacer.username}
                </span>
                <span className="sun-player-score">
                  {isCurrentUser(sunRacer) ? localSolvedCount : (sunRacer.puzzlesSolved || 0)}/{totalPuzzles}
                </span>
              </>
            ) : (
              <span className="sun-waiting">Waiting…</span>
            )}
          </div>
        </div>
      </div>

      {/* Current user star when outside top slots */}
      {!currentUserInSlots && currentUserRacer && (
        <div className="current-user-star-3d">
          <div className="star-glow-3d" />
          <div className="star-info-3d">
            <span className="star-username-3d">⭐ You</span>
            <span className="star-rank-3d">
              Rank #{currentUserRacer.rank} · {localSolvedCount}/{totalPuzzles} solved
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleRacer;