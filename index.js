const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const admin = require("firebase-admin");
const port = process.env.PORT || 3000;



const serviceAccount = require("./home-nest-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// middleWare
app.use(cors());
app.use(express.json())

const verifyFirebaseToken = async(req, res, next) => {
    const authorization = req.headers.authorization;
    console.log("in the verify middleware", req.headers.authorization)
    if(!authorization) {
        return res.status(401).send({ message: 'unauthorized access'})
    }
    const token = authorization.split(' ')[1];
    if(!token) {
        return res.status(401).send({message: 'unauthorized access' })
    }
    try{
       const userInfo = await admin.auth().verifyIdToken(token);
       req.token_email = userInfo.email;
       console.log('after token validation', userInfo)
        next();
    }
    catch{
        return res.status(401).send({message: 'unauthorized access' })
    }

    
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.otmudjl.mongodb.net/?appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('Server is running 🚀');
});

async function run() {
    try{
            await client.connect();

            const db= client.db('homenest_db');
            const productsCollection = db.collection('products');
            const myPropertyCollection = db.collection('myproperty');
            const ratingCollection = db.collection('rating');
            const userCollection = db.collection('users');

            

            app.post('/users', async(req, res) => {
                const newUser = req.body;
                const email = req.body.email;
                const query = { email: email}
                const existingUser = await userCollection.findOne(query);
                if(existingUser) {
                    res.send('user already exists. do not need to insert again')
                }
                else{
                    const result = await userCollection.insertOne(newUser)
                    res.send(result)
                }
               
            })

            app.get('/latest-properties', async(req, res) =>{
                const cursor = productsCollection.find().sort({posted_date: -1}).limit(8);
                const result = await cursor.toArray();
                res.send(result);
            })

            app.get('/products', async(req, res) =>{
                const user_email = req.query.user_email;
                const query = {}
                if(user_email) {
                    query.user_email = user_email;
                }
                const cursor = productsCollection.find(query);
                const result = await cursor.toArray();
                res.send(result)
            })
            
            app.get('/products/:id', async(req, res) =>{
                const id = req.params.id;
                const query = { product_id: req.params.id};
                const result = await productsCollection.findOne(query);
                res.send(result);
            } )

            app.post('/products', verifyFirebaseToken, async(req, res) => {
                const newProduct = req.body;
                const result = await productsCollection.insertOne(newProduct);
                res.send(result);
                
            })
            app.patch('/products/:id', async(req, res) => {
                const id = req.params.id;
                const updatedProduct = req.body;
                const query = { _id: new ObjectId(id) } 
                const update = {
                    $set: {
                        name: updatedProduct.name,
                        price: updatedProduct.price
                    }
                }
                const result = await productsCollection.updateOne(query, update)
                res.send(result)
            })

            app.delete('/products/:id', async(req, res) => {
                const id = req.params.id;
                const query = { _id: new ObjectId(id)}
                const result = await productsCollection.deleteOne(query);
                res.send(result);
            })

                         // myProperty realted apis
            app.get('/myproperty',verifyFirebaseToken, async(req, res) =>{
                const user_email = req.query.user_email;
                const query = { user_email: user_email};
                const result = await productsCollection.find(query).toArray();
                res.send(result); 
            })
             
           app.get('/rating', verifyFirebaseToken, async (req, res) => {
                try {
                  const user_email = req.query.user_email;
                
                  if (!user_email) {
                    return res.status(400).send({ message: 'Email required' });
                  }
              
                  if (user_email !== req.token_email) {
                    return res.status(403).send({ message: 'forbidden access' });
                  }
              
                  const result = await ratingCollection.aggregate([
                    {
                      $match: { user_email }
                    },
                    {
                      $lookup: {
                        from: "products",
                        localField: "product",
                        foreignField: "_id",
                        as: "productInfo"
                      }
                    },
                    {
                      $unwind: {
                        path: "$productInfo",
                        preserveNullAndEmptyArrays: true
                      }
                    }
                  ]).toArray();
              
                  res.send(result);
              
                } catch (error) {
                  console.log("🔥 ERROR:", error);   // 👈 console এ exact error দেখবে
                  res.status(500).send({ message: 'Internal Server Error' });
                }
            });
            app.get('/products/rating/:productId',async(req, res) => {
                const productId = req.params.productId;
                const query = {product: productId}
                const cursor = ratingCollection.find(query).sort({rating: 1})
                const result = await cursor.toArray();
                res.send(result);
            })
             app.post('/rating', async(req, res) => {
                const newRating = req.body;
                const result = await ratingCollection.insertOne(newRating);
                res.send(result);
             })
             app.get('/rating/:id', async(req, res) =>{
                const id = req.params.id;
                const query = { _id: new ObjectId(id)}
                const result = await ratingCollection.findOne(query);
                res.send(result);
            })
            app.delete('/rating/:id', async(req, res) => {
                const id = req.params.id;
                const query = { _id: new ObjectId(id)}
                const result = await ratingCollection.deleteOne(query);
                res.send(result);
            })    

            await client.db("admin").command({ ping: 1});
            console.log("ping your deployment. you successfully connected to Mongodb");
    }finally{

    }
}
run().catch(console.dir)

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});