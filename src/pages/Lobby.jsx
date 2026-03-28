import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  connectLobby,
  listenLobby,
  cleanupLobby,
} from "../socket/lobbySocket";

const PLAYERS_PER_PAGE = 5;

const Lobby = () => {
  const [onUsers, setOnUsers] = useState(0);
  const [userNames, setUserNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);
  const [page, setPage] = useState(0);

  const navigate = useNavigate();
  const username = localStorage.getItem("user_itself_name");

  useEffect(() => {
    if (!username) {
      navigate("/");
      return;
    }

    connectLobby(username);

    listenLobby({
      setLoading,
      setOnUsers,
      setUserNames,
      setMyId,
    });

    return () => {
      cleanupLobby();
    };
  }, []);

  // bring current user to top
  const sortedPlayers = [...userNames].sort((a, b) => {
    if (a.id === myId) return -1;
    if (b.id === myId) return 1;
    return 0;
  });

  // if current page becomes invalid after users leave, go back
  const totalPages = Math.max(
    1,
    Math.ceil(sortedPlayers.length / PLAYERS_PER_PAGE)
  );

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  const paginatedPlayers = sortedPlayers.slice(
    page * PLAYERS_PER_PAGE,
    (page + 1) * PLAYERS_PER_PAGE
  );

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVH();
    window.addEventListener("resize", setVH);

    return () => window.removeEventListener("resize", setVH);
  }, []);

  return (
    <div className="home-theme relative w-full h-[calc(var(--vh)*100+0.5px)] px-4 py-6 flex justify-center items-center overflow-hidden">
      <div className="home-theme-panel w-full max-w-3xl p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center text-(--home-text)">
          Online Players: {onUsers}
        </h1>

        {loading && (
          <p className="text-center mt-5 text-sm sm:text-base">
            Server is waking up... wait a minute
          </p>
        )}

        {/* PLAYER LIST */}
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
                {/* Name */}
                <span className="block truncate text-xl">
                  {player.name}
                </span>

                {/* Current User */}
                {isMe ? (
                  <span
                    className="absolute -top-2 -right-2 
                    bg-(--home-accent) text-white text-xs px-2 py-0.5 rounded-md shadow"
                  >
                    YOU
                  </span>
                ) : (
                  <button
                    onClick={() => navigate("/play")}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                    bg-(--home-accent) hover:bg-(--home-accent-strong)
                    text-white text-xs sm:text-sm
                    px-3 py-1.5 rounded-lg
                    transition-all duration-200
                    active:scale-95 shadow-[0_0_10px_var(--home-accent)]"
                  >
                    Req DUEL
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-6">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="text-(--home-accent) text-xl disabled:opacity-30"
            >
              ◀
            </button>

            <span className="text-(--home-text) text-sm sm:text-base">
              {page + 1} / {totalPages}
            </span>

            <button
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="text-(--home-accent) text-xl disabled:opacity-30"
            >
              ▶
            </button>
          </div>
        )}

        {/*<button
          onClick={() => navigate("/play")}
          className="mt-8 w-full rounded-xl bg-(--home-accent) p-3 sm:p-4 font-semibold text-white hover:bg-(--home-accent-strong) transition-colors duration-200"
        >
          Start Match
        </button>*/}
      </div>
    </div>
  );
};

export default Lobby;