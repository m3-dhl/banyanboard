import request from 'supertest';
import app from '../app';
import * as cardRepository from '../repositories/card.repository';

jest.mock('../repositories/card.repository');

const mockedRepo = cardRepository as jest.Mocked<typeof cardRepository>;

const CARD_ID = 'b1c2d3e4-f5a6-7890-bcde-f12345678901';
const NOW = new Date('2026-06-16T10:00:00.000Z');

const mockCard = {
  id: CARD_ID,
  title: 'Design login page',
  columnId: 'todo' as const,
  createdAt: NOW,
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// POST /cards
// ---------------------------------------------------------------------------

describe('POST /cards', () => {
  it('returns 201 with a Card object on valid input', async () => {
    mockedRepo.createCard.mockResolvedValue(mockCard);

    const res = await request(app)
      .post('/cards')
      .send({ title: 'Design login page', columnId: 'todo' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: CARD_ID,
      title: 'Design login page',
      columnId: 'todo',
    });
    expect(res.body.createdAt).toBeDefined();
  });

  it('returns 400 with error message when title is absent', async () => {
    const res = await request(app)
      .post('/cards')
      .send({ columnId: 'todo' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title is required/i);
  });

  it('returns 400 when title is an empty string', async () => {
    const res = await request(app)
      .post('/cards')
      .send({ title: '', columnId: 'todo' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title is required/i);
  });

  it('returns 400 when title is whitespace only', async () => {
    const res = await request(app)
      .post('/cards')
      .send({ title: '   ', columnId: 'todo' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title is required/i);
  });

  it('returns 400 when title exceeds 100 characters', async () => {
    const res = await request(app)
      .post('/cards')
      .send({ title: 'A'.repeat(101), columnId: 'todo' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when columnId is missing', async () => {
    const res = await request(app)
      .post('/cards')
      .send({ title: 'New card' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/columnId/i);
  });

  it('returns 400 when columnId is not a valid value', async () => {
    const res = await request(app)
      .post('/cards')
      .send({ title: 'New card', columnId: 'invalid-column' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/columnId/i);
  });

  it('returns 500 on unexpected repository error', async () => {
    mockedRepo.createCard.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app)
      .post('/cards')
      .send({ title: 'New card', columnId: 'todo' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});
