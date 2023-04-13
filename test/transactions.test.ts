import { afterAll, beforeAll, describe, expect, it, beforeEach } from 'vitest'
import supertest from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('Transaction routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  // deve ser possível fazer x
  it('should be able to create a new transaction', async () => {
    // fazer a chamada http
    await supertest(app.server)
      .post('/transactions')
      .send({
        title: 'Freelancer Vida',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
    // // validação
    // expect(response.statusCode).toEqual(201)
  })

  it('should be possible to list all transactions', async () => {
    const createTransactionResponse = await supertest(app.server)
      .post('/transactions')
      .send({
        title: 'Freelancer Vida',
        amount: 5000,
        type: 'credit',
      })

    const cookie = createTransactionResponse.get('Set-Cookie')

    const response = await supertest(app.server)
      .get('/transactions')
      .set('Cookie', cookie)
      .expect(200)

    expect(response.body.transactions).toEqual([
      expect.objectContaining({
        title: 'Freelancer Vida',
        amount: 5000,
      }),
    ])
  })

  it('should be able get a specific summary', async () => {
    const createTransactionResponse = await supertest(app.server)
      .post('/transactions')
      .send({
        title: 'Freelancer',
        amount: 5000,
        type: 'credit',
      })

    const cookie = createTransactionResponse.get('Set-Cookie')

    const response = await supertest(app.server)
      .get('/transactions')
      .set('Cookie', cookie)

    const transactionId = response.body.transactions[0].id

    const getTransactionResponse = await supertest(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookie)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'Freelancer',
        amount: 5000,
      }),
    )
  })

  it('should be able get summary', async () => {
    const createTransactionResponse = await supertest(app.server)
      .post('/transactions')
      .send({
        title: 'Freelancer',
        amount: 5000,
        type: 'credit',
      })

    const cookie = createTransactionResponse.get('Set-Cookie')

    await supertest(app.server)
      .post('/transactions')
      .set('Cookie', cookie)
      .send({
        title: 'Hamburguer',
        amount: 500,
        type: 'debit',
      })

    const getSummaryResponse = await supertest(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookie)

    expect(getSummaryResponse.body.summary).toEqual(
      expect.objectContaining({
        amount: 4500,
      }),
    )
  })
})
