const express = require("express");
const http = require("http");
const ws = require("ws");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const firebase = require("firebase/app");
const admin = require("firebase-admin");
const serviceAccount = require("./limaplan-firebase-adminsdk-e8tgg-fb2c6245ae.json");

let csrfProtection = csrf({ cookie: true });
let parseForm = express.urlencoded({ extended: false });

//initialize express
const server = express();
const connect = http.createServer(server);
const wss = new ws.Server({ server });

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

server.post("/", function (req, res) {
  const query = req.body.cityName;
  const apiKey = "2ba3f323809895bb010d33f8d63f037f";
  const unit = "metric";
  const url =
    "https://api.openweathermap.org/data/2.5/weather?q=" +
    query +
    "&appid=2ba3f323809895bb010d33f8d63f037f";
  http.get(url, function (response) {
    response.on("data", function (data) {
      const weatherData = JSON.parse(data);
      const temp = weatherData.main.temp;
      console.log(temp);
      const weatherDescrption = weatherData.weather[0].description;
      console.log(weatherDescrption);
      var temperatureInDegree = Math.floor(temp - 273);
      const icon = weatherData.weather[0].icon;
      const imageURL = "https://openweathermap.org/img/wn/" + icon + "@2x.png";
      res.write(
        "<h1>The  temperature in " +
          query +
          " is " +
          temperatureInDegree +
          " degrees celsiures</h1>"
      );
      res.write("<p>The weather is " + weatherDescrption + " </p>");
      res.write("<img src='" + imageURL + "'>");

      res.send();
    });
  });
});

//render static files
server.use(express.static("public"));
server.use("/css", express.static(__dirname + "/public/css"));
server.use("/images", express.static(__dirname + "/public/images"));
server.use("/js", express.static(__dirname + "/public/js"));

server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(cookieParser());

// Set the view engine to ejs
server.set("view engine", "ejs");
server.set("views", "./views");
server.get('/', (req, res) => {
  res.render('homepage');
});

//crsf protection
server.get("/form", csrfProtection, function (req, res) {
  res.render("send", { csrfToken: req.csrfToken() });
});
server.post("/process", parseForm, csrfProtection, function (req, res) {
  res.send("data is being processed");
});

server.get("/login", (req, res) => {
  res.render("login");
});
server.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Authenticate user using Firebase Authentication
    await firebase.auth().signInWithEmailAndPassword(email, password);
    res.redirect('/');
  } catch (error) {
    res.render('login', { error: error.message });
  }
});

server.get("/signup", (req, res) => {
  res.render("signup");
});
server.post('/signup', async (req, res) => {
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

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');

  ws.on('message', (message) => {
    console.log('Received message:', message);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Start the Express server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
