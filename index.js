const express = require('express')
const app = express()
const CyclicDb = require("@cyclic.sh/dynamodb")
const db = CyclicDb("agile-plum-sparrowCyclicDB")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// #############################################################################
// This configures static hosting for files in /public that have the extensions
// listed in the array.
var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm', 'html','css','js','ico','jpg','jpeg','png','svg'],
  index: ['index.html'],
  maxAge: '1m',
  redirect: false
}
app.use(express.static('public', options))
// #############################################################################

const TODO_COLLECTION = 'todos'
const COUNTER_COLLECTION = 'counters'

/**
 * 
 * @param {string} collection the name of the collection to increment
 * @returns {number} the new value of the counter
 */
async function incrementCount(collection) {
  let counter = await db.collection(COUNTER_COLLECTION).get(collection)
  console.log(`counter: ${JSON.stringify(counter, null, 2)}`)

  let value = 0

  if (counter === null) {
    value = 1
  }
  else {
    value = counter.props.value + 1
  }

  const updatedCounter = await db.collection(COUNTER_COLLECTION).set(collection, { value: value })
  console.log(`counter: ${JSON.stringify(counter, null, 2)}`)
  return updatedCounter.props.value
}

// Create an item
app.post('/todos.create', async (req, res) => {
  console.log(req.body)

  const key = await incrementCount(TODO_COLLECTION)
  console.log(`key: ${key}`)
  const item = await db.collection(TODO_COLLECTION).set(key.toString(), { id: key, ...req.body })
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Get a single item
app.get('/todos.get', async (req, res) => {
  console.log(req.query)
  const key = req.query.id
  const item = await db.collection(TODO_COLLECTION).get(key)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Update an item
app.post('/todos.update', async (req, res) => {
  const key = req.params.key
  const item = await db.collection(TODO_COLLECTION).set(key, req.body)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Delete an item
app.post('/todos.delete', async (req, res) => {
  const key = req.body.id.toString()
  const item = await db.collection(TODO_COLLECTION).delete(key)
  console.log(JSON.stringify(item, null, 2))
  res.json(item).end()
})

// Get a full listing
app.get('/todos.list', async (req, res) => {
  const items = await db.collection(TODO_COLLECTION).list()
  console.log(JSON.stringify(items, null, 2))
  res.json(items).end()
})

// Catch all handler for all other request.
app.use('*', (req, res) => {
  // return index
  res.sendFile('index.html', { root: __dirname })
})

// Start the server
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`index.js listening on ${port}`)
})
