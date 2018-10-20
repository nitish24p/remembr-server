const express = require('express');

const otpGenerator = require('otp-generator');
const otpConfig = {
    alphabets: false,
    upperCase: false,
    specialChars: false
};

const router = express.Router();

const rooms = [];

router.post('/createRoom', (req, res) => {
    let roomId = '';
    do {
        roomId = otpGenerator.generate(6, otpConfig);
    } while (rooms.includes(roomId));
    rooms.push(roomId);
    res.status(200).send({'room_id' : roomId});
});

router.post('/join', (req, res) => {
  let doesCodeExist = false;
  const { roomId } = req.body;
  if (rooms.includes(roomId)) {
    doesCodeExist = true
  }

  res.send({status: doesCodeExist});
})

router.get('/', (req, res) => {
    res.send("ok");
});

module.exports = router;