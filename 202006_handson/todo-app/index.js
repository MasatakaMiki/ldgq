const line = require('@line/bot-sdk');
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const myLiffId = process.env.MY_LIFF_ID;

const bodyParser = require("body-parser");
const knex = require('knex');

// Database
const db = knex({
    client: "pg",
    connection: {
        host: process.env.PG_HOST,
        user: process.env.PG_USER,
        password: process.env.PG_PWD,
        database: process.env.PG_NAME,
        port: process.env.PG_PORT
    }
});

// LINE Bot
const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
};
const client = new line.Client(config);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/send-id', function(req, res) {
    res.json({id: myLiffId});
});

app.get("/get-list", (req, res) => {
    let userid = 'hoge';
    if (req.query.userid) {
        console.log('userid is specified:' + req.query.userid);
        userid = req.query.userid;
    } else {
        console.log('no userid is specified');
    }
    db.select("*")
        .from("todolist")
        .where("userid", userid)
        .then(data => {
        console.log(data);
        res.json({datas: data});
        }).catch(err => res.status(400).json(err));
});

app.post("/addTask", (req, res) => {
    console.log(req.body);
    const { text_todo, hidden_userid } = req.body;
    db("todolist").insert({ userid: hidden_userid, task: text_todo }).returning("*")
        .then(_=> {
            res.redirect("/");
        }).catch(err => res.status(400).json(err));
});

app.post("/completeTask", (req, res) => {
    console.log(req.body);
    const { id, hidden_userid } = req.body;
    const nowTime = new Date();
    db("todolist").where({ id: id })
        .update({ status: 1, updated: nowTime })
        .then(_=> {
            res.json({ updated: nowTime });
        }).catch(err => res.status(400).json(err));
});

app.post("/removeTask", (req, res) => {
    console.log(req.body);
    const { id, hidden_userid } = req.body;
    const nowTime = new Date();
    db("todolist").where({ id: id })
        .del()
        .then(_=> {
            res.json({ deleted: nowTime });
        }).catch(err => res.status(400).json(err));
});

app.post('/sendMessage', (req, res) => {
    console.log(req.body);
    const { hidden_userid, message } = req.body;

    client.pushMessage(hidden_userid, {
        type: 'text',
        text: message,
        sender: {
/*
        name: "チャンピオン 三木",
        iconUrl: "https://p62.f2.n0.cdn.getcloudapp.com/items/04uPNLeG/59UcuxelIy3u3Nc1584956046_1584956055.png?v=c586b91712e6400e8055dc46c7f30ac9",
*/
        }
    })
    .then(_=> {
        res.json("sent a message");
    }).catch(err => res.status(400).json(err));
});

app.listen(port, () => console.log(`app listening on port ${port}!`));
