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

// Get batch pokemon data
app.get("/api/v1/pokemons/", async (req, res) => {
  const {count, after} = req.query;
  if (!count || !after) {
    return res.status(400).json({errMsg: "Count or After query params are missing!", status: "ClientError"})
  }
  await pokemonModel.find({}).skip(after).limit(count)
    .then((respond) => {
      if (respond.length === 0) {
        return res.status(400).json({status: "Error", errMsg: "Invalid query! There are no more pokemons!"})
      }
      res.status(200).json({data: respond, status: "Success"})
    })
    .catch((err) => {
      console.log('err', err)
      return res.status(500).json({status: "ServerError", errMsg: "An error occured when fetching pokemons"})
    });
})

// Add a pokemon
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

// Get a pokemon data by id
app.get("/api/v1/pokemon/:id", async (req, res) => {
  const {id} = req.params
  if (!id) {
    return res.status(400).json({status: "ClientError", errMsg: "pokemonId is missing in the request params!"})
  }

  await pokemonModel.find({_id: id})
    .then((pokemon) => {
      if (pokemon.length !== 1) {
        return res.status(400).json({status: "Error", errMsg: "There are no pokemon with id " + id})
      }
      return res.status(200).json({status: "Success", data: pokemon[0]})
    })
    .catch((err) => {
      return res.status(500).json({status: "Error", errMsg: "There is no pokemon with id " + id})
    })
})

// Get pokemon image
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

// Delete a pokemon
app.delete("/api/v1/pokemon/:id", async (req, res) => {
  const {id} = req.params
  if (!id) {
    return res.status(400).json({status: "ClientError", errMsg: "pokemonId is missing in the request params!"})
  }

  await pokemonModel.deleteOne({_id: id})
    .then(respond => {
      console.log('doc', respond)
      return res.status(200).json({status: "Success", msg: `Pokemon with id ${id} has been successfully deleted`})
    })
    .catch(err => {
      console.error(`Error found when deleting a pokemon with id ${id}: ${err}`)
      return res.status(500).json({status: "Error", errMsg: "Issue found when deleting pokemon with id " + id})
    })
})

// Upsert a partial pokemon document
app.patch("/api/v1/pokemon/:id", async (req, res) => {
  const {id} = req.params
  const newPokemonValues = req.body

  try {
    await pokemonModel.updateOne({_id: id}, newPokemonValues)
      .then(doc => {
        return res.status(200).json({status: "Success", data: {newPokemonValues}})
      })
  } catch (err) {
    return res.status(500).json({status: "Errror", errMsg: `Error when upserting pokemon ${id}`})
  }
})

// Update the entire pokemon document
app.put("/api/v1/pokemon/:id", async (req, res) => {
  const {id} = req.params
  const newPokemonValues = req.body

  try {
    await pokemonModel.replaceOne({_id: id}, newPokemonValues)
      .then(doc => {
        return res.status(200).json({status: "Success", data: newPokemonValues})
      })
  } catch (err) {
    console.log(err)
    return res.status(500).json({status: "Errror", errMsg: `Error when updating pokemon ${id}`})
  }
})



