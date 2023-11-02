const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const firebase = require("firebase/app");
const admin = require("firebase-admin");
const serviceAccount = require("./limaplan-firebase-adminsdk-e8tgg-fb2c6245ae.json");

let csrfProtection = csrf({ cookie: true });
let parseForm = express.urlencoded({ extended: false });

//initialize express
const app = express();
const server = http.createServer();

//initilize admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://limaplan-default-rtdb.europe-west1.firebasedatabase.app",
});

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCGwxkr0JE5lW6Vs4aEcP0UOvAdDB0Oo1U",
  authDomain: "limaplan.firebaseapp.com",
  projectId: "limaplan",
  storageBucket: "limaplan.appspot.com",
  messagingSenderId: "764239832937",
  appId: "1:764239832937:web:7bf322f58ad65cf369bff8",
  measurementId: "G-NVWVESQDSG",
};
firebase.initializeApp(firebaseConfig);

//render static files
app.use(express.static("public"));
app.use("/css", express.static(__dirname + "/public/css"));
app.use("/images", express.static(__dirname + "/public/images"));
app.use("/js", express.static(__dirname + "/public/js"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Set the view engine to ejs
app.set("view engine", "ejs");
app.set("views", "./views");
app.get('/', (req, res) => {
  res.render('homepage');
});

//crsf protection
app.get("/form", csrfProtection, function (req, res) {
  res.render("send", { csrfToken: req.csrfToken() });
});
app.post("/process", parseForm, csrfProtection, function (req, res) {
  res.send("data is being processed");
});

app.get("/login", (req, res) => {
  res.render("login");
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Authenticate user using Firebase Authentication
    await firebase.auth().signInWithEmailAndPassword(email, password);
    res.redirect('/');
  } catch (error) {
    res.render('login', { error: error.message });
  }
});

app.get("/signup", (req, res) => {
  res.render("signup");
});
app.post('/signup', async (req, res) => {
  const { email, password, username } = req.body;
  try {
    // Create user in Firebase Authentication
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);

    const userId = userCredential.user.uid;
    const db = admin.database();
    const userRef = db.ref('users/' + userId);
    await userRef.set({
      email: email,
      username: username,
      password: password
    });

    res.redirect('/');
  } catch (error) {
    res.render('signup', { error: error.message });
  }
});

// Start the Express server
server.on('request', app)
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({server: server});

wss.on('connection', function connection(ws) {
  const numClients = wss.clients.size;
  console.log('Clients connected', numClients);

  wss.broadcast('Current visitors: ${numClients}');

  if (ws.readyState === ws.OPEN) {
    ws.send('Welcome');
  }

  ws.on('close', function close() {
    console.log('Client disconnected');
  });
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
}