const express = require('express')
const mongoose = require('mongoose')
const axios = require('axios')
const {Schema} = mongoose
const getThreeCharDigit = require("./utility");

const app = express()
const port = 5050

// Middlewares
app.use(express.json())

var pokemonSchema;
var pokemonModel;

// app.get('/api/v1/pokemons?count=2&after=10')     // - get all the pokemons after the 10th. List only Two.
// app.post('/api/v1/pokemon')                      // - create a new pokemon
// app.get('/api/v1/pokemon/:id')                   // - get a pokemon
// app.get('/api/v1/pokemonImage/:id')               // - get a pokemon Image URL
// app.patch('/api/v1/pokemon/:id')                 // - update a pokemon
// app.delete('/api/v1/pokemon/:id')                // - delete a  pokemon


// 1. Establish connection to the DB
// 2. Create the Schema
// 3. Create the model
// 4. Populate the DB with pokemons
app.listen(process.env.PORT || port, async (err) => {
  if (err) {
    console.log(err)
  }
    try {
      await mongoose.connect('mongodb+srv://testUser:COMP4537_password@cluster0.vtxvo7p.mongodb.net/?retryWrites=true&w=majority')
      
      var pokemonTypes;
      await axios.get("https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/types.json")
        .then((res) => {
          pokemonTypes = res.data.map(type => {
            return type.english;
          });
        })
        .catch((err) => {
          console.log('err', err)
        })

      pokemonSchema = new Schema({
        "id": {type: String},
        "name": {
          "english": {type: String, maxlength: 20},
          "japanese": {type: String},
          "chinese": {type: String},
          "french": {type: String},
        },
        "type": {
          type: [String], enum: pokemonTypes
        },
        "base": {type: Object},
      }, {versionKey: false});
      pokemonModel = mongoose.model("pokemons", pokemonSchema)

      let pokemons;
      await axios.get("https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/pokedex.json")
        .then((res) => {
          pokemons = res.data
        })
        .catch((err) => {
          console.log('err', err)
        });
      
      // await pokemonModel.deleteMany({});
      // await pokemonModel.insertMany(pokemons);
    } catch (error) {
      console.log('db connection error', error);
    }
    console.log(`Example app listening on port ${port}`)
  }
)

app.get("/api/v1/pokemons/", async (req, res) => {
  const {count, after} = req.query;
  if (!count || !after) {
    return res.status(400).json({errMsg: "Count or After query params are missing!", status: "ClientError"})
  }
  await pokemonModel.find({}).skip(after).limit(count)
    .then((respond) => {res.status(200).json({data: respond, status: "Success"})})
    .catch((err) => {
      console.log('err', err)
      return res.status(500).json({status: "ServerError", errMsg: "An error occured when fetching pokemons"})
    });
})

app.post("/api/v1/pokemon", async (req, res) => {
  const pokemonValues = req.body;
  if (!pokemonValues || Object.keys(pokemonValues).length === 0) {
    return res.status(400).json({status: "ClientError", errMsg: "request body is missing!"})
  }
  // console.log('pokemonValues', pokemonValues)
  await pokemonModel.create(pokemonValues)
    .then((doc) => {
      console.log('doc', doc)
      return res.status(200).json({status: "Success!", data: doc})
    })
    .catch((err) => {
      console.log('err', err)
      return res.status(500).json({status: "ServerErrror", errMsg: "Error encountered when creating a pokemon"})
    })
})

app.get("/api/v1/pokemon/:id", async (req, res) => {
  const {id} = req.params
  if (!id) {
    return res.status(400).json({status: "ClientError", errMsg: "pokemonId is missing in the request params!"})
  }

  await pokemonModel.find({_id: id})
    .then((pokemon) => {
      return res.status(200).json({status: "Success", data: pokemon})
    })
    .catch((err) => {
      return res.status(400).json({status: "Error", errMsg: "There is no pokemon with id " + id})
    })
})

app.get("/api/v1/pokemonImage/:id", async (req, res) => {
  const {id} = req.params
  if (!id) {
    return res.status(400).json({status: "ClientError", errMsg: "pokemonId is missing in the request params!"})
  }

  try {
    let pokemonAPIId;
    await pokemonModel.find({_id: id})
      .then((pokemon) => {
        pokemonAPIId = pokemon[0].id
      })
      .catch(err => {
        return res.status(400).json({status: "Error", errMsg: "Issue found when getting pokemonId of " + id})
      })

    const baseImageLinkURL = "https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/"
    return res.status(200).json({status: "Success", imageLink: `${baseImageLinkURL}` +`${getThreeCharDigit(pokemonAPIId)}` + `.png`})
  } catch (err) {
    console.log('err', err)
    return res.status(500).json({status: "Error", errMsg: err})
  }
})



