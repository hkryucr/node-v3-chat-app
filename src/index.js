const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages.js')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const port = process.env.PORT || 3001;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

io.on('connection',(socket)=>{
    console.log('New WebSocket Connection')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ 
            id: socket.id, 
            ...options
        });

        if(error){
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback();
    })

    socket.on('sendMessage', (message, callback)=>{
        const user = getUser(socket.id);

        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('locationMessage', (location, callback)=>{
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude}, ${location.longitude}`))
        callback()
    })
    
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user){
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
})

http.listen(port, ()=>{
    console.log(`Server is up on port ${port}`);
})

/*
** 1st step
1) Initialize npm and install express (in chat-app)
 - npm init
 - npm i express
2) set up a new express server
 - serve up the public directory
 - Listen on port 3000
3) Create index.html and render "Chat App" to the screen
4) Test your work - start the server (npm src/index.js)

** 2nd step - setup scripts in package.json
1) Create a "start" script (start: "node src/index.js" + dev: "nodemon src/index.js")
2) Install nodemon and a development dependency (npm i nodemon@1.18.7 --save-dev)
3) Create a "dev" script to start the app using nodemon
4) Run both scripts to test your work (run start dev)

** 3rd step - install socket.io@2.2.0 install
1) npm install socket.io@2.2.0
2) npm run dev
3) refactor the code to connect the server with the browser
    a) const http = require('http')
    b) const server = http.createServer(app)
    c) instead of using app.listen -> server.listen()
4) add socketio
    - const socketio = require('socket.io)
    - io = socketio(server)  // socketio expects it to be called with the raw http. That's the reason why we need to make seperate http call;
5) add checker ->
    - io.on('connection',()=>{console.log('New WebSocket Connection')})
    - inside index.html
        -   <script src="/socket.io/socket.io.js"></script>
            <script src="/js/chat.js"></script>

after the app done,

6) Deploy the chat application

1. Setup Git and Commit files
    - Ignore node_modules folder
2. Setup a github repository and push code up
3. Set up a Heroku app and push code up
4. Open the live app and test your work.            
*/