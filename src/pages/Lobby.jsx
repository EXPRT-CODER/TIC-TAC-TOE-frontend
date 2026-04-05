import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket/socket";
import {
  connectLobby,
  listenLobby,
  cleanupLobby,
  sendDuelRequest,
  cleanupDuelListeners,
} from "../socket/lobbySocket";

const PLAYERS_PER_PAGE = 5;

const Lobby = () => {
  const [onUsers, setOnUsers] = useState(0);
  const [userNames, setUserNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [page, setPage] = useState(0);

  const [duelInvite, setDuelInvite] = useState(null);
  const [requestingPlayerId, setRequestingPlayerId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username;

  // 1. Manage Lobby Connection
  useEffect(() => {
    if (!username) {
      navigate("/");
      return;
    }

    // Attach listeners BEFORE emitting the connection to ensure we catch immediate server responses
    listenLobby({
      setLoading,
      setOnUsers,
      setUserNames,
      setMyId,
    });

    connectLobby(username);

    return () => {
      cleanupLobby();
      // Ensure state resets on unmount so stale data doesn't flash if we re-enter
      setUserNames([]);
      setOnUsers(0);
    };
  }, [username, navigate]);

  // 2. Manage Duel Listeners
  useEffect(() => {
    if (!myId) return;

    const handleDuelRequest = ({ fromId, fromName }) => {
      setDuelInvite({ fromId, fromName });
    };

    const handleDuelStarted = ({ roomId, players }) => {
      setRequestingPlayerId(null);
      setDuelInvite(null);
      navigate(`/play/${roomId}`, {
        state: { roomId, players, myId },
      });
    };

    socket.on("duelRequest", handleDuelRequest);
    socket.on("duelStarted", handleDuelStarted);

    return () => {
      // Explicitly remove these exact listeners to prevent duplicate firing
      socket.off("duelRequest", handleDuelRequest);
      socket.off("duelStarted", handleDuelStarted);
      cleanupDuelListeners();
    };
  }, [myId, navigate]);

  // 3. View Height Fix for Mobile
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);
    return () => window.removeEventListener("resize", setVH);
  }, []);

  // 4. Memoize the sorted players to prevent sorting on every single re-render
  const sortedPlayers = useMemo(() => {
    return [...userNames].sort((a, b) => {
      if (a.id === myId) return -1;
      if (b.id === myId) return 1;
      return 0;
    });
  }, [userNames, myId]);

  // 5. Derived state for pagination (Removed the buggy useEffect)
  const totalPages = Math.max(1, Math.ceil(sortedPlayers.length / PLAYERS_PER_PAGE));
  const validPage = Math.min(page, Math.max(0, totalPages - 1)); // Forces page to be within valid bounds
  
  const paginatedPlayers = sortedPlayers.slice(
    validPage * PLAYERS_PER_PAGE,
    (validPage + 1) * PLAYERS_PER_PAGE
  );

  // Handlers
  const handleAcceptDuel = () => {
    socket.emit("acceptDuel", { fromId: duelInvite.fromId });
    setDuelInvite(null);
  };

  const handleRequestDuel = (playerId) => {
    setRequestingPlayerId(playerId);
    sendDuelRequest(playerId);
  };

  return (
    <div className="home-theme relative w-full h-[calc(var(--vh)*100+0.5px)] px-4 py-6 flex justify-center items-center overflow-hidden">
      <div className="home-theme-panel w-full max-w-3xl p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center text-(--home-text)">
          Online Players: {onUsers}
        </h1>

        {duelInvite && (
          <div className="mt-5 mb-4 rounded-xl border border-yellow-400 bg-yellow-100 p-4 text-black shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="font-semibold">
                {duelInvite.fromName} challenged you!
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleAcceptDuel}
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Accept
                </button>

                <button
                  onClick={() => setDuelInvite(null)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <p className="text-center mt-5 text-sm sm:text-base">
            Server is waking up... wait a minute
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {paginatedPlayers.map((player) => {
            const isMe = player.id === myId;

            return (
              <div
                key={player.id}
                className={`lobby-player relative px-4 py-3 text-center text-base sm:text-lg md:text-xl ${
                  isMe
                    ? "border-2 border-(--home-accent) shadow-[0_0_10px_var(--home-accent)]"
                    : ""
                }`}
              >
                <span className="block truncate text-xl">
                  {player.name}
                </span>

                {isMe ? (
                  <span className="absolute -top-2 -right-2 bg-(--home-accent) text-white text-xs px-2 py-0.5 rounded-md shadow">
                    YOU
                  </span>
                ) : (
                  <button
                    onClick={() => handleRequestDuel(player.id)}
                    disabled={requestingPlayerId === player.id}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                    bg-(--home-accent) hover:bg-(--home-accent-strong)
                    text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg
                    transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70
                    shadow-[0_0_10px_var(--home-accent)]"
                  >
                    {requestingPlayerId === player.id ? "Requesting" : "Req DUEL"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-6">
            <button
              disabled={validPage === 0}
              onClick={() => setPage((p) => p - 1)}
              className="text-(--home-accent) text-xl disabled:opacity-30"
            >
              ◀
            </button>

            <span className="text-(--home-text) text-sm sm:text-base">
              {validPage + 1} / {totalPages}
            </span>

            <button
              disabled={validPage === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="text-(--home-accent) text-xl disabled:opacity-30"
            >
              ▶
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


export default Lobby;