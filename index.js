const express = require('express')
const mongoose = require('mongoose')
const {Schema} = mongoose

const app = express()
const port = 5050

app.use(express.json())


// app.get('/api/v1/pokemons?count=2&after=10')     // - get all the pokemons after the 10th. List only Two.
// app.post('/api/v1/pokemon')                      // - create a new pokemon
// app.get('/api/v1/pokemon/:id')                   // - get a pokemon
// app.get('/api/v1/pokemonImage/:id')               // - get a pokemon Image URL
// app.patch('/api/v1/pokemon/:id')                 // - update a pokemon
// app.delete('/api/v1/pokemon/:id')                // - delete a  pokemon



app.listen(process.env.PORT || port, async (err) => {
    if (err) {
      console.log(err)
    }
      try {
        await mongoose.connect('mongodb+srv://testUser:COMP4537_password@cluster0.vtxvo7p.mongodb.net/?retryWrites=true&w=majority')
      } catch (error) {
        console.log('db connection error', error);
      }
      console.log(`Example app listening on port ${port}`)
    }
)