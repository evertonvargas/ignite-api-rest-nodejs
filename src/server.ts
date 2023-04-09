import fastify from 'fastify'
import { knex } from './database'
import { randomUUID } from 'node:crypto'
import { env } from './env'

const app = fastify()

app.get('/', async () => {
  const transactions = knex('transactions').select('*')
  return transactions
})

app.post('/', async () => {
  const transaction = await knex('transactions')
    .insert({
      id: randomUUID(),
      title: 'transação de teste',
      amount: 1000,
    })
    .returning('*')

  return transaction
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log(`Server running: http://localhost:${env.PORT}`)
  })
