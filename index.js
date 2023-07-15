import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/add', function (req, res) {
  res.render('add');
});
app.listen(3000);
