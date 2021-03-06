'use strict'
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const compression = require('compression')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const app = express()

var cookieParser = require('cookie-parser')
app.use(cookieParser())

//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug')
app.use(compression())
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))



app.use(awsServerlessExpressMiddleware.eventContext())

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index.pug', { title: 'Hey', message: 'Hello there!'});
})

// ------------------------------
// sign in
// ------------------------------
app.get('/signin', (req, res) => {
  res.render('user/signin.pug', { title: 'ログイン', pretty:true});
})

app.get('/signin-complete', (req, res) => {
  res.render('user/signin-complete.pug', { title: 'ログインしました', pretty:true});
})


// ------------------------------
// sign out
// ------------------------------
app.get('/signout', (req, res) => {
  res.render('user/signout.pug', { title: 'サインアウト', pretty:true});
})

app.get('/signout-complete', (req, res) => {
  res.render('user/signout-complete.pug', { title: 'サインアウトしました', pretty:true});
})

// ------------------------------
// sign out global
// ------------------------------
app.get('/signout-global', (req, res) => {
  res.render('user/signout-global.pug', { title: '全端末サインアウト', pretty:true});
})

app.get('/signout-global-complete', (req, res) => {
  res.render('user/signout-global-complete.pug', { title: '全端末サインアウトしました', pretty:true});
})

// ------------------------------
// sign up
// ------------------------------
app.get('/signup', (req, res) => {
  res.render('user/signup.pug', { title: 'ユーザ登録'});
})

app.get('/signup-confirm', (req, res) => {
  res.render('user/signup-confirm.pug', { title: 'ユーザ登録確認'});  
})

app.get('/signup-complete', (req, res) => {
  res.render('user/signup-complete.pug', { title: 'ユーザ登録しました'});  
})

// ------------------------------
// forget password
// ------------------------------
app.get('/forget-password', (req, res) => {
  res.render('user/forget-password.pug', { title: 'パスワード再設定'});  
})

app.get('/forget-password-confirm', (req, res) => {
  res.render('user/forget-password-confirm.pug', { title: 'パスワード確認'});  
})

app.get('/forget-password-complete', (req, res) => {
  res.render('user/forget-password-complete.pug', { title: 'パスワードを再設定しました'});  
})

// ------------------------------
// change password
// ------------------------------
app.get('/change-password', (req, res) => {
  res.render('user/change-password.pug', { title: 'パスワード変更'});  
})

app.get('/change-password-complete', (req, res) => {
  res.render('user/change-password-complete.pug', { title: 'パスワードを変更しました'});  
})
// ------------------------------
// profile
// ------------------------------
app.get('/profile', (req, res) => {
  console.log(req.cookies);
  res.render('user/update-profile.pug', { title: 'プロフィール変更'});  
})

app.get('/update-profile', (req, res) => {
  res.render('user/update-profile.pug', { title: 'プロフィール変更'});  
})

app.get('/update-profile-complete', (req, res) => {
  res.render('user/update-profile-complete.pug', { title: 'プロフィールを変更しました'});  
})

// ------------------------------
// delete user
// ------------------------------
app.get('/delete-user', (req, res) => {
  res.render('user/delete-user.pug', { title: 'ユーザ削除'});  
})

app.get('/delete-user-complete', (req, res) => {
  res.render('user/delete-user-complete.pug', { title: 'ユーザを削除しました'});  
})

// Export your express server so you can import it in the lambda function.
module.exports = app
