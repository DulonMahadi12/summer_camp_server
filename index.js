require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

app.get('/', (req, res) => {
  res.send('Summer-Camp-Server: Running...');
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
    const rawCoursesCollection = client
      .db('summer_camp')
      .collection('raw_courses');
    const cartCollection = client.db('summer_camp').collection('userCart');
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
      const query = { email: userMatched };
      const findUser = await userCollection.findOne(query);
      if (findUser) {
        res.status(406).send({ message: 'user not acceptable, already exist' });
      } else {
        const data = await req?.body;
        const result = await userCollection.insertOne(data);
        res.send(result);
      }
    });
    //
    //get single user:
    app.get('/alluser', verifyJWT, async (req, res) => {
      const userEmail = req?.query?.email;
      const decodedEmail = await req?.decoded?.email;

      if (userEmail !== decodedEmail) {
        return res
          .status(400)
          .send({ error: true, message: 'authorization fails!' });
      }

      const query = { email: userEmail };

      const result = await userCollection.findOne(query);
      // console.log(result);
      res.send(result);
    });
    //
    //add post req to post any course by instructor:
    app.post('/rawcourse', verifyJWT, async (req, res) => {
      const data = await req?.body;
      const result = await rawCoursesCollection.insertOne(data);
      console.log(result);

      res.send(result);
    });
    //
    //get all courses that add by instructor:
    app.get('/rawcourse', verifyJWT, async (req, res) => {
      const userEmail = req?.query?.email;

      const query = { instructor_email: userEmail };
      const result = await rawCoursesCollection.find(query).toArray();
      // console.log(result);

      res.send(result);
    });
    //
    //verify that admin is admin:
    const verifyAdmin = async (req, res, next) => {
      const userEmail = await req?.query?.email;
      const query = { email: userEmail };

      const findUser = await userCollection.findOne(query);

      if (findUser?.user_role !== 'admin') {
        return res
          .status(401)
          .send({ error: true, message: 'notfound, user is not an admin!' });
      } else {
        next();
      }
    };
    //
    //admin get all users:
    app.get('/manageUser', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await userCollection.find({}).toArray();
      // console.log(result);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
    //
    //
    //admin manage course all users:
    app.get('/managecourse', verifyJWT, verifyAdmin, async (req, res) => {
      const result = await rawCoursesCollection.find({}).toArray();
      // console.log(result);
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
    //
    //course approved by admin
    app.patch('/course-approved/:status', verifyJWT, async (req, res) => {
      const id = req?.query?.id;
      const status = req?.params?.status;
      // console.log(id, status);
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updates = {
        $set: { course_status: status },
      };
      const result = await rawCoursesCollection.updateOne(
        filter,
        updates,
        options
      );
      res.send(result).status(200);
    });

    //
    //get request for find course data which is approved by admin:
    app.get('/courses', async (req, res) => {
      const query = { course_status: 'approved' };
      const result = await rawCoursesCollection.find(query).toArray();
      res.send(result);
    });
    //
    //get request for find course data which is approved by admin:
    app.get('/instructors', async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });
    //
    //
    //get request for find single course data which is approved by admin:
    app.get('/course/details:id', async (req, res) => {
      const courseId = req?.params?.id;

      const query = { _id: new ObjectId(courseId) };
      const result = await rawCoursesCollection.findOne(query);
      // console.log(result);

      res.send(result).status(200);
    });
    //
    //
    //add user cart item in mongo db:
    app.post('/addcart', verifyJWT, async (req, res) => {
      const data = await req?.body;

      const result = await cartCollection.insertOne(data);
      res.send(result).status(200);
    });
    //
    //
    //add user cart item in mongo db:
    app.get('/cart', verifyJWT, async (req, res) => {
      const queryEmail = req?.query?.email;
      const result = await cartCollection.find({ email: queryEmail }).toArray();
      res.send(result).status(200);
    });
    //
    //
  } finally {
    // Ensures that the client will close when you finish/error
    // connection = await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  //listening on port 3000:
  console.log(`server running at port: http://localhost:${port}`);
});
