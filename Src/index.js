const express = require('express');
const mongoose = require("mongoose");
const redis = require("redis");



const PORT = 4000;
const app = express();


// ========== Redis Connection ==========

const REDIS_HOST = 'redis';
const REDIS_PORT = 6379;

const redisClient = redis.createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
});
redisClient.on("error", (err) => console.log("Redis Client Error", err))
redisClient.on("connect", () => console.log("connected to redis...."))
redisClient.connect();


// ========== MongoDB Connection ==========
const DB_USER='root';
const DB_PASSWORD='example';
const DB_PORT=27017;
const DB_HOST='mongo';
const URI = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}`
mongoose.connect(URI)
    .then(() => console.log('connect to db...'))
    .catch((err) => console.log('connect to db: ', err) )

// ========== Example Schema ==========
const productSchema = new mongoose.Schema({
    name: String,
    price: Number
});
const Product = mongoose.model("Product", productSchema);

// ========== Routes ==========
// Add a product
// Add a product (GET for testing)
app.get('/add', async (req, res) => {
    const newProduct = new Product({ name: "Phone", price: 3000 });
    await newProduct.save();

    await redisClient.del("products");

    res.send(" Product added and cache cleared!");
});

// Get products with caching
app.get('/products', async (req, res) => {
    try {
        const cacheData = await redisClient.get("products");
        if (cacheData) {
            console.log(" from cache");
            return res.send(`<h2>From Cache</h2> ${cacheData}`);
        }

        const products = await Product.find();
        await redisClient.setEx("products", 60, JSON.stringify(products));

        console.log("from DB and cached");
        res.send(`<h2>From DB</h2> ${JSON.stringify(products)}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});



app.get('/', (req, res) => {
    redisClient.set("product" , "first product ......")
    res.send('<h1>Hello World dddssssssddd</h1>');
});

app.get('/data_cached', async  (req, res) => {
   const products = await redisClient.get("product");
    res.send(`<h1>Hello World dddssssssddd</h1>  <h2>${products}</h2>`);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});