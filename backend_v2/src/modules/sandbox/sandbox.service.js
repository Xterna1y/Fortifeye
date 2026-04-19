import { readData, writeData } from "../../config/db.js";
import { v4 as uuid } from "uuid";

export const startSession = (url) => {
  const sessions = readData("sandboxSessions");

  const session = {
    session_id: uuid(),
    url,
    events: [],
  };

  sessions.push(session);
  writeData("sandboxSessions", sessions);

  return session;
};

export const addEvent = (session_id, event) => {
  const sessions = readData("sandboxSessions");

  const session = sessions.find((s) => s.session_id === session_id);
  session.events.push(event);

  writeData("sandboxSessions", sessions);

  return session;
};