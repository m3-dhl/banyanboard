import request from 'supertest';
import app from '../app';
import * as labelRepository from '../repositories/label.repository';
import * as cardRepository from '../repositories/card.repository';

jest.mock('../repositories/label.repository');
jest.mock('../repositories/card.repository');

const mockedLabelRepo = labelRepository as jest.Mocked<typeof labelRepository>;
const mockedCardRepo = cardRepository as jest.Mocked<typeof cardRepository>;

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const BOARD_ID = 'a0000000-0000-0000-0000-000000000001';
const CARD_ID  = 'b1111111-1111-1111-1111-111111111111';
const LABEL_ID = 'c2222222-2222-2222-2222-222222222222';
const NOW = new Date('2026-06-16T10:00:00.000Z');

const mockLabel = {
  id: LABEL_ID,
  name: 'Bug',
  color: '#C0392B',
  boardId: BOARD_ID,
  createdAt: NOW,
};

const mockCard = {
  id: CARD_ID,
  title: 'Fix login bug',
  columnId: 'todo' as const,
  createdAt: NOW,
  labels: [],
};

// ---------------------------------------------------------------------------
// Reset mocks between tests so state never leaks across cases
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// POST /labels
// ---------------------------------------------------------------------------

describe('POST /labels', () => {
  it('returns 201 with a Label object on valid input', async () => {
    mockedLabelRepo.createLabel.mockResolvedValue(mockLabel);

    const res = await request(app)
      .post('/labels')
      .send({ name: 'Bug', color: '#C0392B', boardId: BOARD_ID });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: LABEL_ID,
      name: 'Bug',
      color: '#C0392B',
      boardId: BOARD_ID,
    });
    expect(res.body.createdAt).toBeDefined();
  });

  it('returns 400 when name is an empty string', async () => {
    const res = await request(app)
      .post('/labels')
      .send({ name: '', color: '#C0392B', boardId: BOARD_ID });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/labels')
      .send({ color: '#C0392B', boardId: BOARD_ID });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when color is not a valid hex value', async () => {
    const res = await request(app)
      .post('/labels')
      .send({ name: 'Bug', color: 'red', boardId: BOARD_ID });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when color hex is malformed (too short)', async () => {
    const res = await request(app)
      .post('/labels')
      .send({ name: 'Bug', color: '#ZZZ', boardId: BOARD_ID });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when boardId is missing', async () => {
    const res = await request(app)
      .post('/labels')
      .send({ name: 'Bug', color: '#C0392B' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when a label with the same name already exists on the board', async () => {
    mockedLabelRepo.getLabelsByBoard.mockResolvedValue([mockLabel]);

    const res = await request(app)
      .post('/labels')
      .send({ name: 'Bug', color: '#C0392B', boardId: BOARD_ID });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('returns 404 when boardId references a non-existent board', async () => {
    mockedLabelRepo.createLabel.mockRejectedValue(
      Object.assign(new Error('Board not found'), { name: 'NotFoundError' }),
    );

    const res = await request(app)
      .post('/labels')
      .send({ name: 'Bug', color: '#C0392B', boardId: BOARD_ID });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GET /labels
// ---------------------------------------------------------------------------

describe('GET /labels', () => {
  it('returns 200 with an array of labels for a valid boardId', async () => {
    mockedLabelRepo.getLabelsByBoard.mockResolvedValue([mockLabel]);

    const res = await request(app).get(`/labels?boardId=${BOARD_ID}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: LABEL_ID, name: 'Bug', color: '#C0392B' });
  });

  it('returns 400 when boardId query param is missing', async () => {
    const res = await request(app).get('/labels');

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// DELETE /labels/:id
// ---------------------------------------------------------------------------

describe('DELETE /labels/:id', () => {
  it('returns 204 when the label exists and is deleted', async () => {
    mockedLabelRepo.deleteLabel.mockResolvedValue(true);

    const res = await request(app).delete(`/labels/${LABEL_ID}`);

    expect(res.status).toBe(204);
  });

  it('returns 404 when the label does not exist', async () => {
    mockedLabelRepo.deleteLabel.mockResolvedValue(false);

    const res = await request(app).delete('/labels/non-existent-id');

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /cards/:id/labels
// ---------------------------------------------------------------------------

describe('POST /cards/:id/labels', () => {
  it('returns 201 with cardId and labelId when attach succeeds', async () => {
    mockedLabelRepo.attachLabelToCard.mockResolvedValue({ cardId: CARD_ID, labelId: LABEL_ID });

    const res = await request(app)
      .post(`/cards/${CARD_ID}/labels`)
      .send({ labelId: LABEL_ID });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ cardId: CARD_ID, labelId: LABEL_ID });
  });

  it('returns 400 when labelId is missing from the request body', async () => {
    const res = await request(app)
      .post(`/cards/${CARD_ID}/labels`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 404 when the card does not exist', async () => {
    mockedLabelRepo.attachLabelToCard.mockRejectedValue(
      Object.assign(new Error('Card not found'), { name: 'NotFoundError' }),
    );

    const res = await request(app)
      .post('/cards/non-existent-card/labels')
      .send({ labelId: LABEL_ID });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('returns 404 when the label does not exist', async () => {
    mockedLabelRepo.attachLabelToCard.mockRejectedValue(
      Object.assign(new Error('Label not found'), { name: 'NotFoundError' }),
    );

    const res = await request(app)
      .post(`/cards/${CARD_ID}/labels`)
      .send({ labelId: 'non-existent-label' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('returns 409 when the label is already attached to the card', async () => {
    mockedLabelRepo.attachLabelToCard.mockRejectedValue(
      Object.assign(new Error('Label already attached to this card'), { name: 'ConflictError' }),
    );

    const res = await request(app)
      .post(`/cards/${CARD_ID}/labels`)
      .send({ labelId: LABEL_ID });

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// DELETE /cards/:id/labels/:labelId
// ---------------------------------------------------------------------------

describe('DELETE /cards/:id/labels/:labelId', () => {
  it('returns 204 when the label is detached successfully', async () => {
    mockedLabelRepo.detachLabelFromCard.mockResolvedValue(true);

    const res = await request(app).delete(`/cards/${CARD_ID}/labels/${LABEL_ID}`);

    expect(res.status).toBe(204);
  });

  it('returns 404 when the card-label association does not exist', async () => {
    mockedLabelRepo.detachLabelFromCard.mockResolvedValue(false);

    const res = await request(app).delete(`/cards/${CARD_ID}/labels/non-existent-label`);

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /cards — label integration
// ---------------------------------------------------------------------------

describe('GET /cards (label integration)', () => {
  it('returns 200 with an empty labels array per card when no labels are assigned', async () => {
    mockedCardRepo.getCards.mockResolvedValue([mockCard]);

    const res = await request(app).get('/cards');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('labels');
    expect(Array.isArray(res.body[0].labels)).toBe(true);
    expect(res.body[0].labels).toHaveLength(0);
  });

  it('returns 200 with label objects in the labels array when labels are assigned', async () => {
    const cardWithLabel = {
      ...mockCard,
      labels: [{ id: LABEL_ID, name: 'Bug', color: '#C0392B' }],
    };
    mockedCardRepo.getCards.mockResolvedValue([cardWithLabel]);

    const res = await request(app).get('/cards');

    expect(res.status).toBe(200);
    expect(res.body[0].labels).toHaveLength(1);
    expect(res.body[0].labels[0]).toMatchObject({
      id: LABEL_ID,
      name: 'Bug',
      color: '#C0392B',
    });
  });
});
