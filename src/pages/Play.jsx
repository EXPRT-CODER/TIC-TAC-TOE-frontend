import { useEffect, useState } from "react";

export default function Play() {
  const [cells, setCells] = useState(Array(9).fill(""));
  const [turn, setTurn] = useState(0);

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);

  const handleClick = (index) => {
    if (cells[index] !== "" || turn >= 9) return;

    const newCells = [...cells];
    const char = turn % 2 === 0 ? "X" : "O";
    newCells[index] = char;

    setCells(newCells);
    setTurn(turn + 1);
  };

  return (
    <div className="home-theme relative w-full h-[calc(var(--vh)*100+0.5px)] px-4 py-6 overflow-hidden flex items-center">
      <div className="home-theme-glow home-theme-glow-top" />
      <div className="home-theme-glow home-theme-glow-bottom" />
      <div className="home-theme-panel mx-auto w-full max-w-3xl p-6 sm:p-8 relative z-10">
        <p className="text-center text-xs sm:text-sm tracking-[0.25em] uppercase text-[var(--home-muted)]">
          Competitive Room
        </p>
        <h2 className="mt-3 text-center text-3xl sm:text-4xl font-semibold text-[var(--home-text)]">
          Match Arena
        </h2>
        <div className="mt-4 flex justify-center">
          <p className="play-turn-badge px-4 py-2 text-sm sm:text-base">
            Current Turn: {turn % 2 === 0 ? "X" : "O"}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          {cells.map((value, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              className={`play-cell aspect-square text-4xl sm:text-6xl font-semibold transition hover:-translate-y-0.5 ${
                value === "X"
                  ? "play-cell-x"
                  : value === "O"
                    ? "play-cell-o"
                    : "play-cell-empty"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setCells(Array(9).fill(""));
            setTurn(0);
          }}
          className="mt-8 w-full rounded-xl border border-[var(--home-border)] bg-white/70 p-3 font-semibold text-[var(--home-accent)] hover:bg-white/90 transition-colors duration-200"
        >
          Reset Board
        </button>
      </div>
    </div>
  );
}
