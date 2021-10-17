const users = [];

const addUser = ({ id, username, room }) => {
  /* clean data */
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();
  /* validate data */
  if (!username || !room) {
    return {
      error: 'Username and room are required!',
    };
  }
  /* check for existing user */
  const existingUser = users.find(
    (user) => user.username === username && user.room === room
  );
  if (existingUser) {
    return {
      error: 'Username is in use.',
    };
  }

  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    return;
  }
  return users.splice(index, 1)[0];
};

const getUser = (id) => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (room) => {
  const usersList = users.filter(
    (user) => user.room === room.trim().toLowerCase()
  );

  return usersList;
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
