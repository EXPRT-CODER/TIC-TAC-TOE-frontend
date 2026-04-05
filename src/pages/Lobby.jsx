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
      cleanupLobby({ disconnect: false });
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
        state: { roomId, players, myId, username },
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
  }, [myId, navigate, username]);

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

  useEffect(() => {
    if (!requestingPlayerId) return;

    const requestedPlayer = userNames.find(
      (player) => player.id === requestingPlayerId
    );

    if (!requestedPlayer || requestedPlayer.playing) {
      setRequestingPlayerId(null);
    }
  }, [requestingPlayerId, userNames]);

  // Handlers
  const handleAcceptDuel = () => {
    socket.emit("acceptDuel", { fromId: duelInvite.fromId });
    setDuelInvite(null);
  };

  const handleRequestDuel = (playerId) => {
    if (userNames.find((player) => player.id === playerId)?.playing) {
      return;
    }

    setRequestingPlayerId(playerId);
    sendDuelRequest(playerId);
  };

  return (
    <div className="home-theme relative w-full h-[calc(var(--vh)*100+0.5px)] px-4 py-6 flex justify-center items-center overflow-hidden">


        {duelInvite && (
  <div className="absolute top-3 left-1/2 z-50 w-[92%] max-w-[320px] -translate-x-1/2 sm:top-5 sm:max-w-95">
    <div className="rounded-2xl border border-white/15 bg-slate-800/92 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
          ⚔️
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white sm:text-base">
            {duelInvite.fromName} challenged you
          </p>

          <p className="mt-0.5 text-xs text-slate-300 sm:text-sm">
            Accept this duel request?
          </p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleAcceptDuel}
              className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 active:scale-[0.98]"
            >
              Accept
            </button>

            <button
              onClick={() => setDuelInvite(null)}
              className="flex-1 rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:bg-rose-600 active:scale-[0.98]"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      <div className="home-theme-panel w-full max-w-3xl p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center text-(--home-text)">
          Online Players: {onUsers}
        </h1>
        {loading && (
          <p className="text-center mt-5 text-sm sm:text-base">
            Server is waking up... wait a minute
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {paginatedPlayers.map((player) => {
            const isMe = player.id === myId;
            const isPlaying = player.playing;
            const isRequesting = requestingPlayerId === player.id;
            const buttonLabel = isPlaying
              ? "Playing"
              : isRequesting
              ? "Requesting"
              : "Req DUEL";

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
                    disabled={isRequesting || isPlaying}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                    bg-(--home-accent) hover:bg-(--home-accent-strong)
                    text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg
                    transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70
                    shadow-[0_0_10px_var(--home-accent)]"
                  >
                    {buttonLabel}
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
