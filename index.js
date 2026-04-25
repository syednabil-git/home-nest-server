const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;
console.log(process.env);
// middleWare
app.use(cors());
app.use(express.json())


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
                const query = { _id: new ObjectId(id)}
                const result = await productsCollection.findOne(query);
                res.send(result);
            } )

            app.post('/products', async(req, res) => {
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
            app.get('/myproperty', async(req, res) =>{
                const user_email = req.query.user_email;
                const query = {};
                if(user_email){
                    query.user_email = user_email;
                }
                const cursor = myPropertyCollection.find(query);
                const result = await cursor.toArray();
                res.send(result); 
            })
             app.post('/myproperty', async(req, res) => {
                const newMyproperty = req.body;
                const result = await myPropertyCollection.insertOne(newRating);
                res.send(result);
             })
             app.get('/myproperty/:id', async(req, res) =>{
                const id = req.params.id;
                const query = { _id: new ObjectId(id)}
                const result = await myPropertyCollection.findOne(query);
                res.send(result);
            })
            app.delete('/myproperty/:id', async(req, res) => {
                const id = req.params.id;
                const query = { _id: new ObjectId(id)}
                const result = await myPropertyCollection.deleteOne(query);
                res.send(result);
            })

                            // rating related apis
            app.get('/rating', async(req, res) =>{
                const user_email = req.query.user_email;
                const query = {};
                if(user_email){
                    query.user_email = user_email;
                }
                const cursor = ratingCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            })
            //  app.get('/rating', async(req, res) =>{
            //     const user_email = req.query.user_email;
            //     const query = {};
            //     if(query.user_email){
            //         query.user_email = user_email;
            //     }
            //     const cursor = ratingCollection.find(query);
            //     const result = await cursor.toArray();
            //     res.send(result);
            // })
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