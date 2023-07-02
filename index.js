require('dotenv').config();
var express = require('express');
var cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

var app = express();

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
    const cartCollection = client.db('clientCard').collection('cart');
    //
    //
    // one operation
    app.get('/cart', async (req, res) => {
      const result = await cartCollection.find({}).toArray();
      res.send(result);
    });
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
