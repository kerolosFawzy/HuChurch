import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import { AdminModel, PersonModel } from './db/database.js';

const app = express();
const saltRounds = 10;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);

app.get('/', function (req, res) {
  if (!req.session.user) res.render('login', { error: false });
  else res.render('home');
});

app.post('/login', function (req, res) {
  const { email, password } = req.body;
  AdminModel.findOne({ username: email ?? '' })
    .then((admins) => {
      if (admins?.username) {
        bcrypt.compare(password, admins.password, function (error, isMatch) {
          if (error) {
            throw error;
          } else if (!isMatch) {
            res.render('login', { error: 'Wrong Password' });
          } else {
            req.session.authenticated = true;
            req.session.user = admins;
            res.redirect('/');
          }
        });
      } else {
        res.render('login', { error: 'User Doesnt Exits' });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get('/add-user', function (req, res) {
  res.render('add-user', { error: false });
});

app.post('/add-user', function (req, res) {
  const data = req.body;
  bcrypt.genSalt(saltRounds, function (saltError, salt) {
    if (saltError) {
      throw saltError;
    } else {
      bcrypt.hash(data.password, salt, async function (hashError, hash) {
        if (hashError) {
          throw hashError;
        } else {
          console.log(hash);
          const Admin = new AdminModel({
            name: data.name,
            phone: data.phone,
            username: data.email,
            password: hash,
          });

          try {
            await Admin.save();
            res.redirect('/');
          } catch (error) {
            res.render('add-user', { error: error.message });
          }
        }
      });
    }
  });
});

app.get('/add', function (req, res) {
  res.render('add', { error: false, success: false });
});

app.post('/add', async function (req, res) {
  console.log(req.body);
  const Person = new PersonModel({
    ...req.body,
  });
  try {
    await Person.save();
    res.render('add', { error: false, success: true });
  } catch (error) {
    console.log(error);
    res.render('add', { error: error.message, success: false });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.use(function (req, res, next) {
  res.render('404');
});

app.listen(3000);
