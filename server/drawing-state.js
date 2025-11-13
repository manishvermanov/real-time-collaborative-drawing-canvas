export function ensureRoom(roomId, rooms) {
  if (!rooms[roomId]) {
    rooms[roomId] = { users: [], strokes: [] };
  }
}

export function addStroke(roomId, stroke, rooms) {
  if (!rooms[roomId]) return;
  const op = {
    ...stroke,
    ts: Date.now()
  };
  rooms[roomId].strokes.push(op);
}

export function getRoomStrokes(roomId, rooms) {
  if (!rooms[roomId]) return [];
  return rooms[roomId].strokes;
}

export function clearRoom(roomId, rooms) {
  if (!rooms[roomId]) return;
  rooms[roomId].strokes = [];
}
