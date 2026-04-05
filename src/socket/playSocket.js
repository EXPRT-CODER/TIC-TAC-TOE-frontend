// socket/playSocket.js

import { socket } from "./socket";

export function setupPlaySocket({
  setCells,
  setTurn,
  onOpponentLeft,
  onGameOver,
}) {
  const handleMoveMade = ({ index, symbol }) => {
    setCells((prev) => {
      const updated = [...prev];
      updated[index] = symbol;
      return updated;
    });

    setTurn(symbol === "X" ? "O" : "X");
  };

  const handleOpponentLeft = () => {
    onOpponentLeft?.();
  };

  const handleGameOver = ({ winner }) => {
    onGameOver?.(winner);
  };

  socket.on("moveMade", handleMoveMade);
  socket.on("opponentLeft", handleOpponentLeft);
  socket.on("gameOver", handleGameOver);

  return () => {
    socket.off("moveMade", handleMoveMade);
    socket.off("opponentLeft", handleOpponentLeft);
    socket.off("gameOver", handleGameOver);
  };
}

export function makeMove(roomId, index, symbol, cells) {
  socket.emit("makeMove", {
    roomId,
    index,
    symbol,
    cells,
  });
}

export function leaveGame() {
  socket.emit("leaveGame");
}