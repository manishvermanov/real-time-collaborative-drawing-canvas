
export function ensureRoom(roomId, rooms) {
  if (!rooms[roomId]) {
    rooms[roomId] = {
      users: [],
      strokes: [],      // Each item = { id, segments: [...] }
      undoStack: []
    };
  }
}

// Add a segment into the correct stroke group
export function addStroke(roomId, strokeId, segment, rooms) {
  const room = rooms[roomId];
  if (!room) return;

  // Any new stroke clears redo history
  room.undoStack = [];

  const strokes = room.strokes;
  const last = strokes[strokes.length - 1];

  // If this strokeId is new → create new stroke group
  if (!last || last.id !== strokeId) {
    strokes.push({
      id: strokeId,
      segments: [segment]
    });
  } else {
    // Continue same stroke group
    last.segments.push(segment);
  }
}

// Undo last stroke
export function undoStroke(roomId, rooms) {
  const room = rooms[roomId];
  if (!room || room.strokes.length === 0) return null;

  const removed = room.strokes.pop();
  room.undoStack.push(removed);

  return removed;
}

// Redo last undone stroke
export function redoStroke(roomId, rooms) {
  const room = rooms[roomId];
  if (!room || room.undoStack.length === 0) return null;

  const stroke = room.undoStack.pop();
  room.strokes.push(stroke);

  return stroke;
}

// Return flat list of segments to redraw everything
export function getRoomStrokes(roomId, rooms) {
  const room = rooms[roomId];
  if (!room) return [];

  const allSegments = [];

  room.strokes.forEach(stroke => {
    stroke.segments.forEach(seg => allSegments.push(seg));
  });

  return allSegments;
}

export function clearRoom(roomId, rooms) {
  const room = rooms[roomId];
  if (!room) return;

  room.strokes = [];
  room.undoStack = [];
}
