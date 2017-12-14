import _ from 'lodash'
import express, { json } from 'express'
import logic from './logic'
import jsonfile from 'jsonfile'
import bodyParser from 'body-parser'

const PORT = 3000
const db = 'src/db.json'

const app = express()

const space = logic.getSpace()


app.use(bodyParser.json({ type: 'application/json' }))
app.get('/space', (req, res) => {
  const space = logic.getSpace()
  return res.send(space)
})
app.get('/lines/:nCollinearPoints', (req, res) => {
  const {nCollinearPoints} = req.params
  const response = logic.getLines(nCollinearPoints)
  return res.send(response)
})

app.post('/point', (req, res) => {
  const point = req.body
  const response = logic.addPoint(point)
  return res.send(response)
})

app.delete('/space', (req, res) => {
  logic.removeSpace()
  return res.send('Removed all points from the space.')
})

app.listen(PORT, () => console.log(`Server started: listen on port ${PORT}`))
