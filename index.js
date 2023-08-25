import express from 'express';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import {
  AdminModel,
  PersonModel,
  deletePerson,
  updatePerson,
} from './db/database.js';
import { removeEmpty } from './utlis/common.js';

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

app
  .route('/')
  .get(function (req, res) {
    if (!req.session.user) res.render('login', { error: false });
    else {
      PersonModel.find({})
        .select('-__v -createdAt -updatedAt')
        .then((users) => {
          res.render('home', { users });
        });
    }
  })
  .post(function (req, res) {
    if (!req.session.user) res.render('login', { error: false });
    else {
      let data = removeEmpty(req.body);
      if (data.min_age || data.max_age) {
        const defaultMinAge = 1;
        const defaultMaxAge = 100;

        const minAge = data.min_age ? parseInt(data.min_age) : defaultMinAge;
        const maxAge = data.max_age ? parseInt(data.max_age) : defaultMaxAge;

        const minAgeMilliseconds = minAge * 365 * 24 * 60 * 60 * 1000;
        const maxAgeMilliseconds = maxAge * 365 * 24 * 60 * 60 * 1000;

        const ageRangeConditions = [
          {
            $lte: [{ $subtract: [new Date(), '$date'] }, maxAgeMilliseconds],
          },
        ];

        if (minAge > defaultMinAge) {
          ageRangeConditions.push({
            $gte: [{ $subtract: [new Date(), '$date'] }, minAgeMilliseconds],
          });
        }

        const query = {};
        for (const param in data) {
          const value = data[param];
          if (value) {
            if (!(param === 'min_age' || param === 'max_age'))
              query[param] = { $regex: `^${value}`, $options: 'i' };
          }
        }
        PersonModel.find(
          {
            $expr: { $and: ageRangeConditions },
            query,
          },
          (err, results) => {
            if (err) {
              console.error(err);
            } else {
              res.render('home', { users: results });
            }
          }
        );
      } else {
        const query = {};
        for (const param in data) {
          const value = data[param];
          if (value) {
            query[param] = { $regex: `^${value}`, $options: 'i' };
          }
        }
        PersonModel.find(query).then((users) => {
          res.render('home', { users });
        });
      }
    }
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
            console.log('success');
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

app
  .route('/add-user')
  .get(function (req, res) {
    res.render('add-user', { error: false });
  })
  .post(function (req, res) {
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

app
  .route('/add')
  .get(function (req, res) {
    res.render('add', { error: false, success: false });
  })
  .post(async function (req, res) {
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

app.get('/edit/:user', function (req, res) {
  if (req.params.user !== 'logo.png') {
    const userString = decodeURIComponent(req.params.user);
    const user = JSON.parse(userString);

    res.render('edit', { user });
  }
});
app.post('/edit', function (req, res) {
  console.log(req.body);
  const user = req.body;
  const _id = user._id;
  delete user._id;

  updatePerson(_id, user);
  res.redirect('/');
});

app.get('/delete', function (req, res) {
  const userId = req.query.id;
  deletePerson(userId);
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.use(function (req, res, next) {
  res.render('404');
});

app.listen(3000);
