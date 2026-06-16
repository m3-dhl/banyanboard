import request from 'supertest';
import app from '../app';
import * as boardRepository from '../repositories/board.repository';

jest.mock('../repositories/board.repository');

const mockedRepo = boardRepository as jest.Mocked<typeof boardRepository>;

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const BOARD_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const NOW = new Date('2026-06-09T10:00:00.000Z');

const mockBoard = {
  id: BOARD_ID,
  title: 'My First Board',
  createdAt: NOW,
  updatedAt: NOW,
};

const updatedBoard = {
  ...mockBoard,
  title: 'Renamed Board',
  updatedAt: new Date('2026-06-09T11:00:00.000Z'),
};

// ---------------------------------------------------------------------------
// Reset mocks between tests so state never leaks across cases
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// GET /boards
// ---------------------------------------------------------------------------

describe('GET /boards', () => {
  it('returns HTTP 200', async () => {
    mockedRepo.getBoards.mockResolvedValue([mockBoard]);

    const res = await request(app).get('/boards');

    expect(res.status).toBe(200);
  });

  it('returns a JSON array of boards', async () => {
    mockedRepo.getBoards.mockResolvedValue([mockBoard]);

    const res = await request(app).get('/boards');

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: BOARD_ID, title: 'My First Board' });
  });
});

// ---------------------------------------------------------------------------
// GET /boards/:id
// ---------------------------------------------------------------------------

describe('GET /boards/:id', () => {
  it('returns 200 and the board when the ID exists', async () => {
    mockedRepo.getBoardById.mockResolvedValue(mockBoard);

    const res = await request(app).get(`/boards/${BOARD_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: BOARD_ID, title: 'My First Board' });
  });

  it('returns 404 when the board does not exist', async () => {
    mockedRepo.getBoardById.mockResolvedValue(null);

    const res = await request(app).get('/boards/non-existent-id');

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /boards
// ---------------------------------------------------------------------------

describe('POST /boards', () => {
  it('returns 201 with the created board when title is valid', async () => {
    mockedRepo.createBoard.mockResolvedValue(mockBoard);

    const res = await request(app)
      .post('/boards')
      .send({ title: 'My First Board' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: BOARD_ID, title: 'My First Board' });
  });

  it('returns 400 when title is missing from the request body', async () => {
    const res = await request(app)
      .post('/boards')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 when title is an empty string', async () => {
    const res = await request(app)
      .post('/boards')
      .send({ title: '' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when title exceeds 100 characters', async () => {
    const longTitle = 'A'.repeat(101);

    const res = await request(app)
      .post('/boards')
      .send({ title: longTitle });

    expect(res.status).toBe(400);
  });

  it('returns a board with id, createdAt, and updatedAt fields', async () => {
    mockedRepo.createBoard.mockResolvedValue(mockBoard);

    const res = await request(app)
      .post('/boards')
      .send({ title: 'My First Board' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// PATCH /boards/:id
// ---------------------------------------------------------------------------

describe('PATCH /boards/:id', () => {
  it('returns 200 with the updated board when the ID exists and title is valid', async () => {
    mockedRepo.updateBoard.mockResolvedValue(updatedBoard);

    const res = await request(app)
      .patch(`/boards/${BOARD_ID}`)
      .send({ title: 'Renamed Board' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: BOARD_ID, title: 'Renamed Board' });
  });

  it('returns 404 when the board does not exist', async () => {
    mockedRepo.updateBoard.mockResolvedValue(null);

    const res = await request(app)
      .patch('/boards/non-existent-id')
      .send({ title: 'Renamed Board' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when the request body is empty', async () => {
    const res = await request(app)
      .patch(`/boards/${BOARD_ID}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 when title exceeds 100 characters', async () => {
    const longTitle = 'A'.repeat(101);

    const res = await request(app)
      .patch(`/boards/${BOARD_ID}`)
      .send({ title: longTitle });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /boards/:id
// ---------------------------------------------------------------------------

describe('DELETE /boards/:id', () => {
  it('returns 204 when the board exists and is deleted', async () => {
    mockedRepo.deleteBoard.mockResolvedValue(true);

    const res = await request(app).delete(`/boards/${BOARD_ID}`);

    expect(res.status).toBe(204);
  });

  it('returns 404 when the board does not exist', async () => {
    mockedRepo.deleteBoard.mockResolvedValue(false);

    const res = await request(app).delete('/boards/non-existent-id');

    expect(res.status).toBe(404);
  });
});
