require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_CONNECTION_STRING;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// jwt authenticate middleware function:
const verifyJWT = (req, res, next) => {
  const authorization = req?.headers?.authorization;
  // console.log(authorization);
  // console.log('------------');

  if (!authorization) {
    return res
      .status(400)
      .send({ error: true, message: 'authorization fails!' });
  }
  // bearer token:
  const token = authorization.split(' ')[1];
  // console.log(token);

  jwt.verify(token, process.env.ACCESS_TOKEN_CLIENT_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(400)
        .send({ error: true, message: 'authorization fails!' });
    }
    req.decoded = decoded;
    next();
  });
};

let connection;
// function read or write to database
async function run() {
  try {
    //
    // Connect the client to the server	(optional starting in v4.7)
    connection = await client.connect();
    //
    //
    // create collection
    const userCollection = client.db('summer_camp').collection('allUser');
    //
    // jwt authentication create access token:
    app.post('/jwt', async (req, res) => {
      const userEmail = await req?.body;
      const token = jwt.sign(
        userEmail,
        process.env.ACCESS_TOKEN_CLIENT_SECRET,
        { expiresIn: '2h' }
      );
      // console.log(token);
      res.send({ token });
    });
    //
    //post all user information after user exist
    app.post('/alluser', async (req, res) => {
      const userMatched = await req?.body?.email;
      const findUser = await userCollection.findOne({ email: userMatched });
      if (findUser) {
        res.status(406).send({ message: 'user not acceptable, already exist' });
      } else {
        const data = await req?.body;
        const result = await userCollection.insertOne(data);
        res.send(result);
      }
    });
    //
    //
    //
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
    //
  } finally {
    // Ensures that the client will close when you finish/error
    // connection = await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server running at port: http://localhost:${port}`);
});
