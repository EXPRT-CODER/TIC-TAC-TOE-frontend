import { socket } from "./socket";

export const connectLobby = (username) => {
  socket.auth = { username };

  if (!socket.connected) {
    socket.connect();

    socket.once("connect", () => {
      socket.emit("joinLobby", { username });
      socket.emit("getLobbySnapshot");
    });
  } else {
    socket.emit("joinLobby", { username });
    socket.emit("getLobbySnapshot");
  }
};

export const listenLobby = ({
  setLoading,
  setOnUsers,
  setUserNames,
  setMyId,
}) => {
  const handleConnect = () => {
    setLoading(false);
  };

  const handleDisconnect = () => {
    setLoading(true);
  };

  const handleUsersUpdate = (data) => {
    setOnUsers(data.count);
    setUserNames(data.names);
  };
  const handleYourId = (id) => {
    setMyId(id);
  };

  socket.on("connect", handleConnect);
  socket.on("disconnect", handleDisconnect);
  socket.on("usersUpdate", handleUsersUpdate);
  socket.on("yourId", handleYourId);

  if (socket.connected) {
    handleConnect();
  }
};

export const sendDuelRequest = (targetId) => {
  socket.emit("sendDuelRequest", { targetId });
};

export const listenForDuelRequests = (navigate, myId) => {
  socket.on("duelRequest", ({ fromId, fromName }) => {
    const accepted = window.confirm(
      `${fromName} wants to play with you`
    );

    if (accepted) {
      socket.emit("acceptDuel", { fromId });
    }
  });

  socket.on("duelStarted", ({ roomId, players }) => {
    navigate(`/play/${roomId}`, {
      state: {
        players,
        myId,
      },
    });
  });
};

export const cleanupDuelListeners = () => {
  socket.off("duelRequest");
  socket.off("duelStarted");
};
export const cleanupLobby = () => {
  socket.off("connect");
  socket.off("disconnect");
  socket.off("usersUpdate");
  socket.off("yourId");

  cleanupDuelListeners();

  socket.disconnect();
};
