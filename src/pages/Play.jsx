import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { socket } from "../socket/socket";

export default function Play() {
  const { roomId } = useParams();
  const { state } = useLocation();

  const myId = state?.myId;
  const players = state?.players;

  const mySymbol = players?.X === myId ? "X" : "O";

  const [cells, setCells] = useState(Array(9).fill(""));
  const [turn, setTurn] = useState("X");

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);

    return () => window.removeEventListener("resize", setVH);
  }, []);
  useEffect(() => {
    const handleMoveMade = ({ index, symbol }) => {
      setCells((prev) => {
        const copy = [...prev];
        copy[index] = symbol;
        return copy;
      });

      setTurn(symbol === "X" ? "O" : "X");
    };

    socket.on("moveMade", handleMoveMade);

    return () => {
      socket.off("moveMade", handleMoveMade);
    };
  }, []);

  const handleClick = (index) => {
    if (cells[index] !== "") return;
    if (turn !== mySymbol) return;

    const newCells = [...cells];
    newCells[index] = mySymbol;

    setCells(newCells);

    const nextTurn = mySymbol === "X" ? "O" : "X";
    setTurn(nextTurn);

    socket.emit("makeMove", {
      roomId,
      index,
      symbol: mySymbol,
    });
  };


  return (
    <div className="home-theme relative w-full h-[calc(var(--vh)*100+0.5px)] px-4 py-6 overflow-hidden flex items-center">
      <div className="home-theme-panel mx-auto w-full max-w-3xl p-6 sm:p-8 relative z-10">
        <h2 className="text-center text-3xl font-semibold text-[var(--home-text)]">
          Match Arena
        </h2>

        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="play-turn-badge px-4 py-2 text-sm sm:text-base">
            You are: {mySymbol}
          </p>

          <p className="play-turn-badge px-4 py-2 text-sm sm:text-base">
            {turn === mySymbol ? "Your Turn" : "Opponent's Turn"}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          {cells.map((value, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={value !== "" || turn !== mySymbol}
              className={`play-cell aspect-square text-4xl sm:text-6xl font-semibold transition ${
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
      </div>
    </div>
  );
}
