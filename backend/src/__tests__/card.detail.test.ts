import request from 'supertest';
import app from '../app';
import * as cardRepository from '../repositories/card.repository';

jest.mock('../repositories/card.repository');

const mockedRepo = cardRepository as jest.Mocked<typeof cardRepository>;

const CARD_ID = 'b1c2d3e4-f5a6-7890-bcde-f12345678901';
const LABEL_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const NOW = new Date('2026-06-16T10:00:00.000Z');

const mockCardDetail = {
  id: CARD_ID,
  title: 'Design login page',
  columnId: 'todo' as const,
  position: 0,
  createdAt: NOW,
  labels: [{ id: LABEL_ID, name: 'bug', color: '#e11d48' }],
  description: 'A detailed description of the card.',
  dueDate: '2026-06-25',
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// GET /cards/:id
// ---------------------------------------------------------------------------

describe('GET /cards/:id', () => {
  it('returns 200 with full card detail including description, dueDate, and labels', async () => {
    mockedRepo.getCardById.mockResolvedValue(mockCardDetail);

    const res = await request(app).get(`/cards/${CARD_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: CARD_ID,
      title: 'Design login page',
      columnId: 'todo',
      position: 0,
      description: 'A detailed description of the card.',
      dueDate: '2026-06-25',
    });
    expect(res.body.labels).toHaveLength(1);
    expect(res.body.labels[0]).toMatchObject({ id: LABEL_ID, name: 'bug', color: '#e11d48' });
    expect(res.body.createdAt).toBeDefined();
  });

  it('returns 200 with null description and null dueDate when card has neither', async () => {
    mockedRepo.getCardById.mockResolvedValue({
      ...mockCardDetail,
      description: null,
      dueDate: null,
      labels: [],
    });

    const res = await request(app).get(`/cards/${CARD_ID}`);

    expect(res.status).toBe(200);
    expect(res.body.description).toBeNull();
    expect(res.body.dueDate).toBeNull();
    expect(res.body.labels).toEqual([]);
  });

  it('returns 404 when card ID does not exist in DB', async () => {
    const { NotFoundError } = await import('../errors/index');
    mockedRepo.getCardById.mockRejectedValue(new NotFoundError(`Card not found: ${CARD_ID}`));

    const res = await request(app).get(`/cards/${CARD_ID}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 when id is not a valid UUID', async () => {
    const res = await request(app).get('/cards/not-a-uuid');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('does not call repository when id is not a valid UUID', async () => {
    await request(app).get('/cards/not-a-uuid');

    expect(mockedRepo.getCardById).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected repository error', async () => {
    mockedRepo.getCardById.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app).get(`/cards/${CARD_ID}`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });

  it('returns 404 using .name check when NotFoundError crosses module boundary', async () => {
    const err = new Error(`Card not found: ${CARD_ID}`);
    err.name = 'NotFoundError';
    mockedRepo.getCardById.mockRejectedValue(err);

    const res = await request(app).get(`/cards/${CARD_ID}`);

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PATCH /cards/:id
// ---------------------------------------------------------------------------

describe('PATCH /cards/:id', () => {
  it('returns 200 with updated card when patching title only', async () => {
    const updated = { ...mockCardDetail, title: 'Updated title' };
    mockedRepo.updateCard.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: CARD_ID, title: 'Updated title' });
  });

  it('returns 200 with updated card when patching description only', async () => {
    const updated = { ...mockCardDetail, description: 'New description content.' };
    mockedRepo.updateCard.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ description: 'New description content.' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: CARD_ID, description: 'New description content.' });
  });

  it('returns 200 when clearing description by sending null', async () => {
    const updated = { ...mockCardDetail, description: null };
    mockedRepo.updateCard.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ description: null });

    expect(res.status).toBe(200);
    expect(res.body.description).toBeNull();
  });

  it('returns 200 with updated card when patching dueDate only with an ISO date string', async () => {
    const updated = { ...mockCardDetail, dueDate: '2026-07-01' };
    mockedRepo.updateCard.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ dueDate: '2026-07-01' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: CARD_ID, dueDate: '2026-07-01' });
  });

  it('returns 200 when clearing dueDate by sending null', async () => {
    const updated = { ...mockCardDetail, dueDate: null };
    mockedRepo.updateCard.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ dueDate: null });

    expect(res.status).toBe(200);
    expect(res.body.dueDate).toBeNull();
  });

  it('returns 200 with updated card when patching columnId only', async () => {
    const updated = { ...mockCardDetail, columnId: 'in-progress' as const };
    mockedRepo.updateCard.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ columnId: 'in-progress' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: CARD_ID, columnId: 'in-progress' });
  });

  it('returns 200 when patching title and description together', async () => {
    const updated = { ...mockCardDetail, title: 'New title', description: 'New description.' };
    mockedRepo.updateCard.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ title: 'New title', description: 'New description.' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ title: 'New title', description: 'New description.' });
  });

  it('returns 400 when title is an empty string', async () => {
    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('returns 400 when title is whitespace only', async () => {
    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ title: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it('returns 400 when title exceeds 100 characters', async () => {
    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ title: 'A'.repeat(101) });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when columnId is not a valid column value', async () => {
    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ columnId: 'invalid-column' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/columnId/i);
  });

  it('returns 400 when id is not a valid UUID', async () => {
    const res = await request(app)
      .patch('/cards/not-a-uuid')
      .send({ title: 'Updated title' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('does not call repository when id is not a valid UUID', async () => {
    await request(app)
      .patch('/cards/not-a-uuid')
      .send({ title: 'Updated title' });

    expect(mockedRepo.updateCard).not.toHaveBeenCalled();
  });

  it('returns 404 when card does not exist', async () => {
    const { NotFoundError } = await import('../errors/index');
    mockedRepo.updateCard.mockRejectedValue(new NotFoundError(`Card not found: ${CARD_ID}`));

    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 500 on unexpected repository error', async () => {
    mockedRepo.updateCard.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });

  it('returns 404 using .name check when NotFoundError crosses module boundary', async () => {
    const err = new Error(`Card not found: ${CARD_ID}`);
    err.name = 'NotFoundError';
    mockedRepo.updateCard.mockRejectedValue(err);

    const res = await request(app)
      .patch(`/cards/${CARD_ID}`)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(404);
  });
});
