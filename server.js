const path = require('path')
const dotenv = require('dotenv')
dotenv.config() // Access to .env

const express = require('express')
const app = express()
app.set('view engine', 'pug')

// All the things needed for Redis Session Storage ------------------
const session = require('express-session')
const redis = require('redis')
const client = redis.createClient({
  url: process.env.REDIS
})
const RedisStore = require('connect-redis')(session)
const store = new RedisStore({client: client})
app.use(
  session({
    secret: process.env.SECRET,
    cookie: {maxAge: 1000 * 60 * 60 * 24},
    store: store,
    resave: false,
    saveUninitialized: false
  })
)
// End RedisStore Config ------------- End RedisStore Config -------
// Mongoose & User config ------------ Mongoose & User Config ------
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO)
const Schema = mongoose.Schema
const userSchema = new Schema({
  username: String,
  password: String, // This should be encrypted
  name: String
})
const User = mongoose.model('User', userSchema)

//End Mongoose & User Config ---------- End Mongoose & User Config---

// Main App Config ------------------- Main App Config --------------
app.use(
  express.urlencoded({extended: false})
).listen(3000, () => { console.log('Server Running @ http://localhost:3000') })
// End Main App Config --------------- End Main App Config ------------

// Passport Config ------------------- Passport Config ----------------
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy

passport.use(
  new LocalStrategy(
    function (username, password, done) {
      User.findOne({username: username}, (err, user) => {
        if (err) throw err
        if (!user) return done(null, false, {message: 'Wrong Username'}) 
        // This is way to simple 
        if (password !== user.password) return done(null, false, {message: 'Wrong Password'})
        // passwords should be encrypted ie. bcrypt
        return done(null, user)
      })
    }
  )
)
app.use(
  passport.initialize(),
  passport.session()
)
// Serialize User ---------------------- Serialize User ------------
passport.serializeUser(function (user, done) {
  done(null, user.id)
})
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user)
  })
})

// End Passport Config ---------------- End Passport Config ---------

// Get Routes -------------------------- Get Routes -----------------
app.get('/', (req, res) => {
  if (!req.user) res.redirect('/login')
  res.render('home', {
    title: 'Home Page',
    profile: req.user
  })
})
app.get('/login', (req, res) => {
  res.render('form', {
    title: 'login'
  })
})
app.get('/register', (req, res) => {
  res.render('form', {
    title: 'register'
  })
})
app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})
// End Get Routes -------------------- End Get Routes -----------------

// Post Routes ------------------------ Post Routes -------------------
app.post('/register', (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
    name: req.body.name
  })
  user.save(() => {
    res.redirect('/login')
  })
})

app.post(
 '/login',
  passport.authenticate('local', {
    successRedirect: '/', 
    failureRedirect: '/login?msg=error'
  })
)
// End Post Routes -------------------- End Post Routes ---------------