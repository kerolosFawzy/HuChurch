import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());
app.use(express.static('public'));
app.get('/', function (req, res) {
  res.render('home');
});

app.get('/add', function (req, res) {
  res.render('add');
});

app.post('/add', function (req, res) {
  console.log(req.body);
});
app.listen(3000);
