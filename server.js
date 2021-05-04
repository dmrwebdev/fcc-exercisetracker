const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const { Schema } = mongoose;

require('dotenv').config();

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json())
app.use(express.static('public'))
app.get('/', (req, res) => res.sendFile(__dirname + '/views/index.html'));

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.once('open', () => console.log('Connected!'))
let collection = db.collection('fcc-exercise-trackers')
const logSchema = new Schema ({
  description: String,
  duration: Number,
  date: String
})
const userSchema = new Schema ({
  username: String,
  logs: [ logSchema ]
})

const User = mongoose.model('Fcc-exercise-tracker', userSchema);

app.route('/api/users')
  .get((req,res) => {
    User.find({}, (err, docs) => {
      let userMap = [];
      docs.forEach(user => {
        userMap.push({ _id: user._id, username: user.username})
      })
      res.send(userMap)
    })
  })
  .post((req, res) => {
    const username = req.body.username;
    collection.findOne({ username: username}, (err, doc) => {
      if (doc !== null) {
        res.send('Username is taken')
      } else {
        let addUser = new User({ username: username});
        addUser.save((err, data) => {
        if(err) return console.error(err);
        res.json({ username: username, _id: data.id})
        })
      }
    })
  })

app.post('/api/users/:_id/exercises', (req, res) => {
  const id = req.body[':_id']
  
  User.findById(id, (err, user) => {
    if(user !== null) {
      const addLog = new Log({
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date
      });
    
      console.log(addLog)
      addLog.save((err, data) => {
        if (err) return console.error(err)
        res.json({
          _id: id,
          username: user.username,
          description: req.body.description,
          duration: req.body.duration,
          date: req.body.date
        })
      })
    } else {
      res.send(err)
    }
  })
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
