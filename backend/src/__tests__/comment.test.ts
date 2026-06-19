import request from 'supertest';
import app from '../app';
import * as cardRepository from '../repositories/card.repository';
import * as commentRepository from '../repositories/comment.repository';

jest.mock('../repositories/card.repository');
jest.mock('../repositories/comment.repository');

const mockedCardRepo = cardRepository as jest.Mocked<typeof cardRepository>;
const mockedCommentRepo = commentRepository as jest.Mocked<typeof commentRepository>;

const CARD_ID = 'b1c2d3e4-f5a6-7890-bcde-f12345678901';
const COMMENT_ID_1 = 'c1d2e3f4-a5b6-7890-cdef-012345678901';
const COMMENT_ID_2 = 'c2d3e4f5-b6c7-8901-defa-123456789012';
const NOW = new Date('2026-06-16T10:00:00.000Z');
const LATER = new Date('2026-06-16T11:00:00.000Z');

const mockCardDetail = {
  id: CARD_ID,
  title: 'Design login page',
  columnId: 'todo' as const,
  position: 0,
  createdAt: NOW,
  labels: [],
  description: null,
  dueDate: null,
};

const mockComment1 = {
  id: COMMENT_ID_1,
  cardId: CARD_ID,
  body: 'First comment — oldest.',
  createdAt: NOW,
};

const mockComment2 = {
  id: COMMENT_ID_2,
  cardId: CARD_ID,
  body: 'Second comment — newest.',
  createdAt: LATER,
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// POST /cards/:id/comments
// ---------------------------------------------------------------------------

describe('POST /cards/:id/comments', () => {
  it('returns 201 with comment object {id, cardId, body, createdAt} on valid input', async () => {
    mockedCardRepo.getCardById.mockResolvedValue(mockCardDetail);
    mockedCommentRepo.createComment.mockResolvedValue(mockComment1);

    const res = await request(app)
      .post(`/cards/${CARD_ID}/comments`)
      .send({ body: 'First comment — oldest.' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: COMMENT_ID_1,
      cardId: CARD_ID,
      body: 'First comment — oldest.',
    });
    expect(res.body.createdAt).toBeDefined();
  });

  it('returns 400 when body is an empty string', async () => {
    const res = await request(app)
      .post(`/cards/${CARD_ID}/comments`)
      .send({ body: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/body/i);
  });

  it('returns 400 when body is whitespace only', async () => {
    const res = await request(app)
      .post(`/cards/${CARD_ID}/comments`)
      .send({ body: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/body/i);
  });

  it('returns 400 when body exceeds 500 characters', async () => {
    const res = await request(app)
      .post(`/cards/${CARD_ID}/comments`)
      .send({ body: 'A'.repeat(501) });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when card id is not a valid UUID', async () => {
    const res = await request(app)
      .post('/cards/not-a-uuid/comments')
      .send({ body: 'A valid comment body.' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('does not call repositories when card id is not a valid UUID', async () => {
    await request(app)
      .post('/cards/not-a-uuid/comments')
      .send({ body: 'A valid comment body.' });

    expect(mockedCardRepo.getCardById).not.toHaveBeenCalled();
    expect(mockedCommentRepo.createComment).not.toHaveBeenCalled();
  });

  it('returns 404 when card ID does not exist', async () => {
    const { NotFoundError } = await import('../errors/index');
    mockedCardRepo.getCardById.mockRejectedValue(new NotFoundError(`Card not found: ${CARD_ID}`));

    const res = await request(app)
      .post(`/cards/${CARD_ID}/comments`)
      .send({ body: 'A valid comment body.' });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('does not call createComment when card existence check fails with NotFoundError', async () => {
    const { NotFoundError } = await import('../errors/index');
    mockedCardRepo.getCardById.mockRejectedValue(new NotFoundError(`Card not found: ${CARD_ID}`));

    await request(app)
      .post(`/cards/${CARD_ID}/comments`)
      .send({ body: 'A valid comment body.' });

    expect(mockedCommentRepo.createComment).not.toHaveBeenCalled();
  });

  it('returns 500 on unexpected repository error during comment creation', async () => {
    mockedCardRepo.getCardById.mockResolvedValue(mockCardDetail);
    mockedCommentRepo.createComment.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app)
      .post(`/cards/${CARD_ID}/comments`)
      .send({ body: 'A valid comment body.' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });

  it('returns 500 on unexpected repository error during card existence check', async () => {
    mockedCardRepo.getCardById.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app)
      .post(`/cards/${CARD_ID}/comments`)
      .send({ body: 'A valid comment body.' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});

// ---------------------------------------------------------------------------
// GET /cards/:id/comments
// ---------------------------------------------------------------------------

describe('GET /cards/:id/comments', () => {
  it('returns 200 with empty array when no comments exist for the card', async () => {
    mockedCardRepo.getCardById.mockResolvedValue(mockCardDetail);
    mockedCommentRepo.getCommentsByCardId.mockResolvedValue([]);

    const res = await request(app).get(`/cards/${CARD_ID}/comments`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 200 with comments ordered oldest first when comments exist', async () => {
    mockedCardRepo.getCardById.mockResolvedValue(mockCardDetail);
    mockedCommentRepo.getCommentsByCardId.mockResolvedValue([mockComment1, mockComment2]);

    const res = await request(app).get(`/cards/${CARD_ID}/comments`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // First element must be older than the second element
    const firstCreatedAt = new Date(res.body[0].createdAt).getTime();
    const secondCreatedAt = new Date(res.body[1].createdAt).getTime();
    expect(firstCreatedAt).toBeLessThan(secondCreatedAt);
    expect(res.body[0].id).toBe(COMMENT_ID_1);
    expect(res.body[1].id).toBe(COMMENT_ID_2);
  });

  it('returns 200 with full comment shape (id, cardId, body, createdAt) for each comment', async () => {
    mockedCardRepo.getCardById.mockResolvedValue(mockCardDetail);
    mockedCommentRepo.getCommentsByCardId.mockResolvedValue([mockComment1]);

    const res = await request(app).get(`/cards/${CARD_ID}/comments`);

    expect(res.status).toBe(200);
    expect(res.body[0]).toMatchObject({
      id: COMMENT_ID_1,
      cardId: CARD_ID,
      body: 'First comment — oldest.',
    });
    expect(res.body[0].createdAt).toBeDefined();
  });

  it('returns 400 when card id is not a valid UUID', async () => {
    const res = await request(app).get('/cards/not-a-uuid/comments');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('does not call repositories when card id is not a valid UUID', async () => {
    await request(app).get('/cards/not-a-uuid/comments');

    expect(mockedCardRepo.getCardById).not.toHaveBeenCalled();
    expect(mockedCommentRepo.getCommentsByCardId).not.toHaveBeenCalled();
  });

  it('returns 404 when card ID does not exist', async () => {
    const { NotFoundError } = await import('../errors/index');
    mockedCardRepo.getCardById.mockRejectedValue(new NotFoundError(`Card not found: ${CARD_ID}`));

    const res = await request(app).get(`/cards/${CARD_ID}/comments`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 500 on unexpected repository error', async () => {
    mockedCardRepo.getCardById.mockResolvedValue(mockCardDetail);
    mockedCommentRepo.getCommentsByCardId.mockRejectedValue(new Error('DB connection lost'));

    const res = await request(app).get(`/cards/${CARD_ID}/comments`);

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});
