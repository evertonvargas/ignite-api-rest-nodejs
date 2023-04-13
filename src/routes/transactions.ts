import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import { string, z } from 'zod'
import { checkSessionIdExist } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  // // criar middleware global pra todas as rotas desse plugin
  // app.addHook('preHandler', (request, reply) => {
  //   console.log(`[${request.method}] ${request.url}`)
  // })

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExist],
    },
    async (request) => {
      const { sessionId } = request.cookies
      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select('*')
      return {
        transactions,
      }
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExist],
    },
    async (request) => {
      const { sessionId } = request.cookies
      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()
      return { summary }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExist],
    },
    async (request) => {
      const idSchema = z.object({
        id: string().uuid(),
      })

      const { id } = idSchema.parse(request.params)
      const { sessionId } = request.cookies

      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      return { transaction }
    },
  )

  app.post('/', async (request, reply) => {
    const transactionBodySchema = z.object({
      title: z.string(),
      type: z.enum(['credit', 'debit']),
      amount: z.number(),
    })

    const { title, amount, type } = transactionBodySchema.parse(request.body)

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions')
      .insert({
        id: randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        session_id: sessionId,
      })
      .returning('*')

    return reply.status(201).send()
  })
}
