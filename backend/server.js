const express=require("express");
const dotenv=require("dotenv");
dotenv.config();
const app=express();
const cors=require('cors');
const connectDB = require("./config/db");
const userRoutes=require("./routes/userRoutes");
const chatRoutes=require("./routes/chatRoutes");
const messageRoutes=require("./routes/messageRoutes");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");
const path=require("path");

connectDB();

app.use(cors());

app.use(express.json())  // to accept json data (post req)

app.get("/", (req, res) => {
  res.send("Backend for Talk-a-tive");
});

app.use('/api/user',userRoutes)
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT=process.env.PORT || 5000;

const server=app.listen(PORT,function(){
    console.log(`Server is running on port ${PORT}`);
});

const io = require("socket.io")(server, {          
    pingTimeout: 60000,
    cors: {
      origin: "https://talk-a-tive-harsh.netlify.app"
      // credentials: true,
    },
  });
//   The pingTimeout option sets the time (in milliseconds) the server will wait for a response from a client before considering it disconnected due to inactivity.
// The cors option defines the Cross-Origin Resource Sharing configuration. It specifies that the server only allows connections from "http://localhost:3000".
  
  io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
    });
//     The io.on("connection", ...) function listens for new client connections.
// When a client connects, the provided callback function is executed, and it receives a socket object representing the newly connected client.
// When a client emits a "setup" event, the server joins the client to a room identified by userData._id.
// The server then emits a "connected" event back to the client.  

    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Room: " + room);
    });
//     When a client emits a "join chat" event, the server joins the client to the room specified in the room parameter.
// The server logs the message indicating that the user has joined the room.

    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

//     When a client emits a "typing" event, the server broadcasts the event to all other clients in the same room.
// Similarly, when a client emits a "stop typing" event, the server broadcasts the event to all other clients in the same room.
  
    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;
  
      if (!chat.users) return console.log("chat.users not defined");
  
      chat.users.forEach((user) => {
        if (user._id == newMessageRecieved.sender._id) return;
  
        socket.in(user._id).emit("message recieved", newMessageRecieved);
      });
    });

   // When a client emits a "new message" event, the server processes the received message and sends it to all users in the chat except the sender.
  
    socket.off("setup", () => {
      console.log("USER DISCONNECTED");
      socket.leave(userData._id);
    });
  });

  //When a client disconnects, the server executes the callback function and logs the message "USER DISCONNECTED".
  //It also makes the client leave the room identified by userData._id.