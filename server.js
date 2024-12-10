const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Material = require("./models/material.js");
const Discussion = require("./models/discussion.js");
const User = require("./models/user.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const {v4 : uuidv4} = require('uuid');
require('dotenv').config();

let MONGO_URL = "mongodb://127.0.0.1:27017/studysphere";



main()
    .then(() => {
        console.log("connected to db");
    })
    .catch((err) => {
        console.log(err);
    });

async function main(){
    mongoose.connect(MONGO_URL);
}


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, ("views")));
app.use(express.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/", (req, res) =>{
    res.send("I am root");
});

app.get("/loading", (req, res) => {
    res.render("login/loading.ejs");
});

app.get("/login", (req, res) => {
    res.render("login/login.ejs");
});

app.get("/home", (req, res) =>{
    res.render("home/index.ejs");
});

app.get("/material", (req, res) => {
    res.render("materials/index.ejs");
});

// Discussion Page
app.get("/discussion", async (req, res) => {
    try {
        let chats = await Discussion.find().exec();
        res.render("discussion/index.ejs", { chats });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

app.get("/discussion/new", (req, res) => {
    res.render("discussion/new.ejs");
});

app.post("/discussion", (req, res) => {
    let {from, msg} = req.body;
    let newChat = new Discussion({
        from: from,
        msg: msg,
        created_at: new Date(),
    });
    
    newChat.save()
    .then((res) => {
        console.log("chat saved");
    })
    .catch((err) => {
        console.log(err);
    })

    res.redirect("/discussion");
});

app.get("/discussion/:id/join", async (req, res) => {
    let {id} = req.params;
    let discussion = await Discussion.findById(id);
    res.render("discussion/reply.ejs", {discussion});
});

app.put("/discussion/:id", async (req, res) => {
    let {id} = req.params;
    let {msg, to} = req.body;
    let updateChat = await Discussion.findByIdAndUpdate(id, {msg}, {to});
    console.log("Updated");
    res.redirect("/discussion");
});



app.delete("/discussion/:id", async (req, res) => {
    let {id} = req.params;
    let deletedChat = await Discussion.findByIdAndDelete(id);
    console.log("chat Deleted");

    res.redirect("/discussion");
});

// Material Page
app.get("/material/watch", (req, res) => {
    res.render("materials/watch.ejs");
});

app.get("/material/pdf", (req, res) => {
    res.render("materials/pdf.ejs");
});



// User registration
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send('User already exists');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.redirect("/login");
});

// User login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Validate user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Invalid email or password');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid email or password');

    // Generate token
    const token = jwt.sign({ _id: user._id }, 'secretkey');

    res.render("home/index.ejs");
});

// Route to render user profile
app.get("/profile", async (req, res) => {
    res.render("home/profile.ejs");
});

// quiz route
app.get("/quiz", (req, res) => {
    res.render("materials/quiz.ejs");
});

// Collaborate route
app.get("/collaborate", (req, res) => {
    res.render("collaborate/appoinment.ejs");
});

app.get("/collaborate/done", (req, res) => {
    res.render("collaborate/done.ejs");
});


const port = process.env.PORT || 8080;
app.listen(port, () =>{
    console.log(`server is listening on port ${port}`);
});

