const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

// middleware
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mcevyaf.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const usersCollection = client.db('adventureCamp').collection('users')
    const classesCollection = client.db('adventureCamp').collection('classes')
    const instructorsCollection = client.db('adventureCamp').collection('instructors')

    app.put('/users/:email', async (req, res) => {
        const email = req.params.email
        const user = req.body
        const query = { email: email }
        const options = { upsert: true }
        const updateDoc = {
          $set: user,
        }
        const result = await usersCollection.updateOne(query, updateDoc, options)
        console.log(result)
        res.send(result)
      })
   

      app.get('/classes', async (req, res) => {
        
        const limit = parseInt(req.query.limit) || 6;
        const result = await classesCollection.find().sort({"students":1}).limit(limit).toArray()
        res.send(result)
      })
      app.get('/allClasses', async (req, res) => {
        const result = await classesCollection.find().limit(limit).toArray()
        res.send(result)
      })

      app.get('/instructors', async (req, res) => {
        const limit = parseInt(req.query.limit) || 6;
        const result = await instructorsCollection.find().limit(limit).toArray()
        res.send(result)
      })
      
      app.get('/allInstructors', async (req, res) => {
        const result = await instructorsCollection.find().toArray()
        res.send(result)
      })



    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Adventure Camp Server is running..')
})

app.listen(port, () => {
  console.log(`Adventure Camp  is running on port ${port}`)
})