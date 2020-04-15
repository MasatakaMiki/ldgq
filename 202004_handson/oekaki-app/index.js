const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const myLiffId = process.env.MY_LIFF_ID;

app.use(express.static('public'));

// for /save (make image files from client reqs)
const bodyParser = require('body-parser');
app.use(bodyParser());
const fs = require('fs');
require('date-utils');

app.get('/send-id', function(req, res) {
    res.json({id: myLiffId});
});

app.listen(port, () => console.log(`app listening on port ${port}!`));

/***
*
*/
app.post('/save', function(req, res) {
    console.log(req.body);
    const base64 = req.body.pad.split(',')[1];
    var dt = new Date();
    var ts = dt.toFormat("YYYYMMDDHH24MISS");
    var fileName = req.body.pad.split(',')[2] + '_' + ts + '.png';
    const decode = new Buffer.from(base64,'base64');
    fs.writeFile('public/imgs/' + fileName, decode, (err) => {
        if(err){
            console.log(err)
        } else {
            console.log(fileName + ' saved');
        }
        res.json({name: fileName});
    });
});
