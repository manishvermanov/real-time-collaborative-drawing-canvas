# 🖼️ Collaborative Realtime Canvas

A real-time multi-user drawing board built using **Node.js**, **Express**, **Socket.IO**, and **Vanilla JavaScript**.
Users can join rooms, draw together, see live cursors, add shapes, insert images, undo/redo strokes, and more.

---

## Features

### Drawing Tools

* Brush (with custom size & colors)
* Eraser (square cursor)
* Line, Rectangle, Circle (shape preview with crosshair cursor)
* Image upload tool (click → place image)

###  Realtime Collaboration

* Multiple users drawing simultaneously
* Unique user colors
* Live cursor movement
* Participants list with active users
* Room-based isolation

### Canvas State

* Full stroke history stored in room memory
* Undo / Redo across all users
* Clear board for the whole room
* Initializes new users with the existing canvas state

###  Performance Tools

* Live FPS counter
* Low-latency Socket events

---

##  Installation & Setup

### **Prerequisites**

* Node.js (v16+)
* npm

---

### **1. Clone the Project**

```sh
git clone <your-repo-url>
cd collaborative-canvas
```

### **2. Install Dependencies**

```sh
npm install
```

### **3. Run the Server**

```sh
npm start
(Note :Change Websocket urk to "http://localhost:3000" from "https://enchanting-clarity-production-7496.up.railway.app/" (client -> websocket.js))

```

### **4. Open the App**

Visit:

```
http://localhost:3000
```

---

##  Testing With Multiple Users

To test real-time collaboration:

### **Method 1: Multiple Browser Windows**

1. Open `http://localhost:3000` in Chrome
2. Open another window in Firefox or Chrome Incognito
3. Join the same room name
4. Draw and interact — everything should sync live

### **Method 2: Share LAN with Friends**

1. Find your local network IP:

   ```sh
   ipconfig
   ```
2. Look for an address like:

   ```
   192.168.x.x
   ```
3. Run server with:

   ```sh
   npm start
   ```
4. Ask friends on the same WiFi to open:

   ```
   http://192.168.x.x:3000
   ```

---

##  How to Use

### **Joining**

* Enter your **name**
* Enter **room name** (any string, e.g., `class1`, `project-room`, `demo`)
* Click **Join**

### **Drawing**

* Use bottom toolbar:

  * Brush / Eraser
  * Shapes
  * Image tool (click canvas → pick image)
  * Undo / Redo
  * Clear board
* Color & brush size also available

### **Participants**

* Sidebar shows active users with their colors
* Auto-updates on join/leave

---

##  Known Limitations / Bugs


###  1. No permanent database

* All canvas data lives **in-memory**
* Rooms disappear when the server restarts

###  2. Image placement scaling is basic

* Images are auto-scaled up to 400px max
* No rotation/resizing handles yet

###  3. Shapes do not have fill mode

* Only outlines are supported

###  4. No mobile zoom/pan

* Mobile touch works, but the canvas cannot be panned or zoomed

###  5. FPS/latency may vary if many users draw simultaneously

* Socket traffic is high for freehand strokes

###  6. Room names have no validation

* Anyone typing the same name can join

---

##  Time Spent on the Project


| Task                              | Time       |
| --------------------------------- | ---------- |
| Basic canvas + brush drawing      | 2 hours    |
| Socket.IO real-time sync          | 2 hours    |
| Undo/redo, stroke grouping        | 1.5 hours  |
| Shapes + preview                  | 1 hour     |
| Image uploads                     | 2 hour     |
| Mobile layout adjustments         | 1 hour     |
| Cursors, participants, bug fixing | 2 hours    |
| UI polishing, testing             | 1–2 hours  |
| Debugging                         | 3 hours    | |
| README & documentation            | 20 minutes |

**Total Estimated Time: ~15-17 hours**


