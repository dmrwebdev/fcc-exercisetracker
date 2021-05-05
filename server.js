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
  date: { 
    type: Date,  
    set: date => date === '' ? new Date().toDateString() : date
  }
}, {_id: false})

const userSchema = new Schema ({ username: String, logs: [ logSchema ] })

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
      const logs = user.logs
      logs.push({
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date
      })
      user.save((err, data) => {
        if (err) return console.error(err)
        res.json({
          _id: id,
          username: user.username,
          description: req.body.description,
          duration: parseInt(req.body.duration),
          date: req.body.date === '' ? new Date().toDateString() : req.body.date
        })
      })
    } else {
      res.send(err)
    }
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const id = req.params['_id']
  const { from, to, limit } = req.query;
  User.findById(id, (err, user) => {
    if(user !== null) {
      let logCopy = []
      Object.keys(user.logs).forEach(key => {
        logCopy.push({
          description: user.logs[key].description,
          duration: user.logs[key].duration,
          date: user.logs[key].date.toDateString()
        })
      })

      let filteredLogs = []
      if (from) {
        logCopy.map(log => {
          const fromDate = new Date(from);
          const logDate = new Date(log.date);
          if (logDate >= fromDate) {
            filteredLogs.push(log)
          };
        })
      }
      if (to) {
        logCopy.map(log => {
          const toDate = new Date(to);
          const logDate = new Date(log.date);
          if (logDate <= toDate) {
            filteredLogs.push(log)
          };
        })
      }
      if (limit) {
        filteredLogs = filteredLogs.slice(0, limit)
      }
      
      res.json({
        '_id' : user['_id'],
        username: user.username,
        count: user.logs.length,
        log: filteredLogs.length > 0 ? filteredLogs : logCopy
      }) 
    } else {
      res.send(err)
    }
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


