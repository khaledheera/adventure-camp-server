const express = require('express')
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken');
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

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}



const { MongoClient, ServerApiVersion ,ObjectId} = require('mongodb');
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

    const usersCollection = client.db('adventure').collection('users')
    const classesCollection = client.db('adventure').collection('classes')
    const selectedCollection = client.db('adventure').collection('selectedClasses')
    const paymentCollection = client.db('adventure').collection('paidClasses')
    const classUpdatedCollection = client.db('adventure').collection('updatedClasses')
    

    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      if (user?.role !== 'admin') {
        return res.status(403).send({ error: true, message: 'forbidden message' });
      }
      next();
    }


    app.get('/users',verifyJWT, verifyAdmin,async (req, res) => {
        const result = await usersCollection.find().toArray();
        res.send(result);
      });

     

      app.put('/users/:email', async (req, res) => {
        
        const user = req.body;
        // const email = req.params.email;
        const filter = { email: user.email };
        const existingUser = await usersCollection.findOne(filter);
  
        if (existingUser) {
          return res.send({ message: 'user already exists' })
        }
  
        const result = await usersCollection.insertOne(user);
        res.send(result);
      });

     
      app.get('/users/:email', async (req, res) => {
        const email = req.params.email
        const query = { email: email }
        const result = await usersCollection.findOne(query)
        res.send(result)
      })


      app.get('/users/admin/:email', verifyJWT, async (req, res) => {
        const email = req.params.email;
  
        if (req.decoded.email !== email) {
          res.send({ admin: false })
        }
  
        const query = { email: email }
        const user = await usersCollection.findOne(query);
        const result = { admin: user?.role === 'admin' }
        res.send(result);
      })


      
      app.patch('/users/admin/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: 'admin'
          },
        };
  
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
  
      })
      app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
        const email = req.params.email;
  
        if (req.decoded.email !== email) {
          res.send({ admin: false })
        }
  
        const query = { email: email }
        const user = await usersCollection.findOne(query);
        const result = { admin: user?.role === 'admin' }
        res.send(result);
      })


      
      app.patch('/users/instructor/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            role: 'instructor'
          },
        };
  
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
  
      })



      app.get('/classes',async(req,res)=>{
        const query={status:"Approved"};
        const limit = parseInt(req.query.limit) || 0;
        const result=await classesCollection.find(query).sort({students:-1}).limit(limit).toArray()
      res.send(result)
      })
      
      app.get('/manageClasses',async(req,res)=>{
        const query={status:"Pending"};
        const result=await classesCollection.find(query).toArray()
      res.send(result)
      })
      app.get('/updatedClasses',async(req,res)=>{
        const result=await classUpdatedCollection.find().toArray()
      res.send(result)
      })
      
      app.patch("/manageClasses/:id",async(req,res)=>{
        const {updateStatus,classUpdateData}=req.body
        const id =req.params.id;
        const filter={_id:new ObjectId(id)}
        const updatedDoc={
          $set:{
            status:updateStatus.status
          },
        };
        const updateResult=await classesCollection.updateOne(filter,updatedDoc) ;
        const addResult=await classUpdatedCollection.insertOne(classUpdateData);
        res.send({updateResult,addResult})
      })

      app.put("/updateFeedback/:id",async(req,res)=>{
        const updateFeedback=req.body
        const id =req.params.id;
        const filterClasses={_id:new ObjectId(id)}
        const filterUpdatedClasses={classId:id}
        const options={upsert:true};

        const updateDoc={
          $set:{
            feedback:updateFeedback.feedback
          },
        };
        const classResult=await classesCollection.updateOne(filterClasses,updateDoc,options) ;
        const updateClassResult=await classUpdatedCollection.updateOne         (filterUpdatedClasses,updateDoc,options);
        res.send({classResult,updateClassResult})
      })


    

     
      app.post('/addClasses',async(req,res)=>{
        const classes=req.body
        const newClass=await classesCollection.insertOne(classes)
        res.send(newClass)
      })
  
      app.get('/addClasses', async (req, res) => {
        const addedClass = classesCollection.find();
        const result = await addedClass.toArray();
        res.send(result);
    })
      app.get('/addClasses/:email', async (req, res) => {
        const addedClass = classesCollection.find();
        const result = await addedClass.toArray();
        res.send(result);
    })

    app.get("/addClasses/instructor/:email", async (req, res) => {
      const classes= await classesCollection.find({instructor_email: req.params.email}).toArray();
      res.send(classes);
    });


    app.put('/addClasses/:id', async (req, res) => {
			const id = req.params.id;
			const filter = { _id: ObjectId(id) };
			const updatedDoc = {
				$set: {
					status: true,
				},
			};

			const result = await productCollections.updateOne(filter, updatedDoc);
			res.send(result);
		});


app.get("/selected",async(req,res)=>{
  const email=req.query.email;
  const filter={email:email};
  const result=await selectedCollection.find(filter).toArray();
  res.send(result);
})



app.post('/selected',async(req,res)=>{
  const data=req.body;
  const filter={ name: data.name,email:data.email}
  const findData= await selectedCollection.findOne(filter);
  if (findData){
    return res.send("Already Exists")
  }
  const result=await selectedCollection.insertOne(data)
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