const express = require('express');

const otpGenerator = require('otp-generator');
const otpConfig = {
    alphabets: false,
    upperCase: false,
    specialChars: false
};

const router = express.Router();

var rooms = [];

router.post('/createRoom', (req, res) => {
    var roomId = '';
    do {
        roomId = otpGenerator.generate(6, otpConfig);
    } while (rooms.includes(roomId));
    rooms.push(roomId);
    res.status(200).send({'room_id' : roomId});
});

router.get('/', (req, res) => {
    res.send("ok");
});

module.exports = router;