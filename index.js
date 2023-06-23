require('dotenv').config();
var express = require('express');
var cors = require('cors');

var app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

const data = { message: 'Data pass success!' };

app.get('/', function (req, res) {
  res.send(data);
});

app.listen(port, () => {
  console.log(`server running at port: http://localhost:${port}`);
});
