// Play.jsx

import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  leaveGame,
  makeMove,
  setupPlaySocket,
} from "../socket/playSocket";

export default function Play() {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const myId = state?.myId;
  const players = state?.players;
  const username = state?.username;

  useEffect(() => {
    if (!myId || !players || !username) {
      navigate("/");
    }
  }, [myId, players, username, navigate]);

  const mySymbol = players?.X === myId ? "X" : "O";

  const [cells, setCells] = useState(Array(9).fill(""));
  const [turn, setTurn] = useState("X");
  const [gameEnded, setGameEnded] = useState(false);

  const [resultMessage, setResultMessage] = useState("");
  const [resultColor, setResultColor] = useState("bg-green-600");

  useEffect(() => {
    let alreadyHandled = false;

    const cleanup = setupPlaySocket({
      setCells,
      setTurn,

      onOpponentLeft: () => {
        alreadyHandled = true;
        setGameEnded(true);

        setResultColor("bg-orange-500");
        setResultMessage("Opponent left the game. You win!");

        setTimeout(() => {
          navigate("/lobby", {
            state: { username },
          });
        }, 5000);
      },

      onGameOver: (winner) => {
        alreadyHandled = true;
        setGameEnded(true);

        if (winner === null) {
          setResultColor("bg-yellow-500");
          setResultMessage("Match Draw!");
        } else if (winner === mySymbol) {
          setResultColor("bg-green-600");
          setResultMessage(`${username} Wins!`);
        } else {
          setResultColor("bg-red-600");
          setResultMessage("Opponent Wins!");
        }

        setTimeout(() => {
          navigate("/lobby", {
            state: { username },
          });
        }, 5000);
      },
    });

    return () => {
      cleanup();

      if (!alreadyHandled) {
        leaveGame();
      }
    };
  }, [mySymbol, navigate, username]);

  const handleClick = (index) => {
    if (gameEnded) return;
    if (turn !== mySymbol) return;
    if (cells[index] !== "") return;

    const updated = [...cells];
    updated[index] = mySymbol;

    setCells(updated);
    setTurn(mySymbol === "X" ? "O" : "X");

    makeMove(roomId, index, mySymbol, updated);
  };

  return (
    <div className="home-theme relative w-full min-h-screen px-4 py-6 flex items-center justify-center">
      {resultMessage && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl text-white text-lg sm:text-xl font-bold shadow-xl transition-all duration-300 ${resultColor}`}
        >
          <div className="text-center">{resultMessage}</div>

          <div className="mt-1 text-center text-sm text-white/90 font-medium">
            Returning to lobby in 5 seconds...
          </div>
        </div>
      )}

      <div className="home-theme-panel w-full max-w-3xl p-6 sm:p-8">
        <h1 className="text-center text-3xl font-bold text-[var(--home-text)]">
          Match Arena
        </h1>

        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="play-turn-badge px-4 py-2">
            You are: {mySymbol}
          </div>

          {!gameEnded && (
            <div className="play-turn-badge px-4 py-2">
              {turn === mySymbol ? "Your Turn" : "Opponent's Turn"}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          {cells.map((cell, index) => (
            <button
              key={index}
              onClick={() => handleClick(index)}
              disabled={cell !== "" || turn !== mySymbol || gameEnded}
              className={`play-cell aspect-square text-4xl sm:text-6xl font-bold transition ${
                cell === "X"
                  ? "play-cell-x"
                  : cell === "O"
                  ? "play-cell-o"
                  : "play-cell-empty"
              }`}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}