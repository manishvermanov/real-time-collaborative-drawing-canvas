### Collaborative Real-Time Drawing Canvas

This document explains the technical architecture, data flow, WebSocket protocol, undo/redo strategy, performance optimizations, and conflict-resolution decisions used in the collaborative canvas system.

---

# 1. **High-Level Architecture**

```
 ┌────────────────────────┐
 │        Frontend        │
 │  (HTML, Canvas API)    │
 ├────────────────────────┤
 │ Drawing UI             │
 │ Stroke capture         │
 │ Shape/Image tools      │
 │ WebSocket client       │
 └──────────────┬─────────┘
                │ WebSocket
                ▼
 ┌────────────────────────┐
 │       Backend (Node)   │
 │        Railway         │
 ├────────────────────────┤
 │ Socket.IO server       │
 │ Room state manager     │
 │ Undo/redo manager      │
 │ Stroke grouping        │
 └──────────────┬─────────┘
                │
                ▼
 ┌────────────────────────┐
 │   In-Memory Storage    │
 │ rooms = { users,       │
 │           strokes,     │
 │           undoStack }  │
 └────────────────────────┘
```

The backend stores **per-room drawing history**, **user list**, and **undo/redo stacks**, while the frontend renders visuals and emits drawing events.

---

# 2. **Data Flow Diagram**

```
User Action (draw/shape/image)
        │
        ▼
Canvas JS generates segment/stroke
        │
        ▼
Socket.emit("stroke", strokeObj)
        │
        ▼
──────────── BACKEND ────────────
        │
Receive stroke event
Add stroke to room’s stroke list
Broadcast to all others
        │
        ▼
socket.to(room).emit("stroke", strokeObj)
        │
        ▼
──────────── FRONTEND ───────────
        │
Receive stroke
Render on canvas
Update cursor previews
```

Undo/redo and clear operations follow the exact same flow:

```
User → emit("undo") → server mutates state → emit("update-canvas") → clients redraw
```

---

# 3. **WebSocket Protocol**

### **Outgoing (Browser → Server)**

| Event Name   | Payload Example                                       | Description                      |
| ------------ | ----------------------------------------------------- | -------------------------------- |
| `join-room`  | `{ roomId, username, clientId }`                      | Join a room & sync state         |
| `stroke`     | `{ strokeId, x, y, lastX, lastY, color, size, type }` | Freehand, shape, or image stroke |
| `cursor`     | `{ x, y }`                                            | Cursor position broadcast        |
| `undo`       | `{}`                                                  | Undo last stroke                 |
| `redo`       | `{}`                                                  | Redo last undone stroke          |
| `clear-room` | `{}`                                                  | Clear entire room                |
| `disconnect` | Auto                                                  | Trigger user removal             |

---

### **Incoming (Server → Browser)**

| Event Name         | Payload                         | Description                      |
| ------------------ | ------------------------------- | -------------------------------- |
| `init-canvas`      | `[segments]`                    | Full history on join             |
| `stroke`           | `strokeObj`                     | One new stroke from another user |
| `update-canvas`    | `[segments]`                    | Full redraw after undo/redo      |
| `clear-canvas`     | `{}`                            | Clear everything                 |
| `cursor`           | `{ id, username, color, x, y }` | Remote cursor positions          |
| `update-user-list` | `[ {id, name, color} ]`         | Live participant list            |
| `user-left`        | `{ id, name }`                  | Someone disconnected             |
| `error-message`    | `msg`                           | Any validation errors            |

---

# 4. **Undo/Redo Strategy**

### **Data Structure**

Each “stroke” (freehand, rectangle, circle, line, image) is grouped as:

```
{
  id: strokeId,
  segments: [ ... ]
}
```


### **Undo flow**

```
pop last stroke  →  push to undoStack  →  broadcast full canvas
```

### **Redo flow**

```
pop undoStack → push back to strokes → broadcast full canvas
```

### Why this strategy?

 **Room state stays authoritative**
 **Every client can reconstruct the canvas from segments**
 **Undo/redo always consistent across users**
 Works for **freehand**, **shapes**, **images**, and **eraser strokes**

---

# 5. **Performance Decisions**

###  No heavy re-rendering during drawing

Only the active stroke is animated on the user’s canvas.

Remote users receive only *finalized* segments.

### ✔ Cursor preview separated (second canvas layer)

* Cursors & shape previews draw on `cursorCanvas`
* Real strokes draw on `drawingCanvas`
* Prevents flicker and avoids unnecessary redrawing

### ✔ FPS counter (optional)

Used to detect performance issues on slower devices.

### ✔ Throttled cursor updates

```
emit cursor update only every 30 ms
```

Prevents network spam.

### ✔ Image scaling (max 200×200)

Reduces bandwidth + rendering cost.

---

# 6. **Conflict Resolution Strategy**

### Problem

Two users might draw at the same time, or both draw shapes/images with overlapping timing.

### Why it works without conflicts:

✔ **Each stroke has strokeId + segments**
✔ **Server appends strokes atomically in order of arrival**
✔ **Canvas is reconstructed strictly in that order**

### Conflict handling details:

| Conflict                               | Resolution                                            |
| -------------------------------------- | ----------------------------------------------------- |
| Two users draw freehand simultaneously | Segments are interleaved but deterministic per client |
| Shape previews overlap                 | Each user sees only their own preview                 |
| Image + shape drawn at same location   | Render order is based on arrival time                 |
| Undo issued during someone drawing     | Only removes previous complete stroke                 |

Undo/Redo **never** affects a stroke still being drawn.

