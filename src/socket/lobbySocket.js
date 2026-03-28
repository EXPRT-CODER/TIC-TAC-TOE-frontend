import { socket } from "./socket";

export const connectLobby = (username) => {
  if (!socket.connected) {
    socket.auth = { username };
    socket.connect();
  }
};

export const listenLobby = ({
  setLoading,
  setOnUsers,
  setUserNames,
  setMyId,
}) => {
  socket.on("connect", () => setLoading(false));
  socket.on("disconnect", () => setLoading(true));

  socket.on("usersUpdate", (data) => {
    setOnUsers(data.count);
    setUserNames(data.names);
  });

  socket.on("yourId", (id) => {
    setMyId(id);
  });
};

export const cleanupLobby = () => {
  socket.off("connect");
  socket.off("disconnect");
  socket.off("usersUpdate");
  socket.off("yourId");
  socket.disconnect();
};