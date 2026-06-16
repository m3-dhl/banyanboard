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
  title: 'Valid Board',
  createdAt: NOW,
  updatedAt: NOW,
};

beforeEach(() => {
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Malformed JSON handling
// ---------------------------------------------------------------------------

describe('Malformed JSON middleware', () => {
  it('returns 400 with { error } body when POST /boards receives invalid JSON', async () => {
    const res = await request(app)
      .post('/boards')
      .set('Content-Type', 'application/json')
      .send('{ this is not valid json }');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });

  it('returns 400 with { error } body when PATCH /boards/:id receives invalid JSON', async () => {
    const res = await request(app)
      .patch(`/boards/${BOARD_ID}`)
      .set('Content-Type', 'application/json')
      .send('{ broken json');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(typeof res.body.error).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// Required field validation on POST /boards (via middleware)
// ---------------------------------------------------------------------------

describe('POST /boards input validation middleware', () => {
  it('returns 400 when title field is missing from request body', async () => {
    const res = await request(app)
      .post('/boards')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when title is an empty string', async () => {
    const res = await request(app)
      .post('/boards')
      .send({ title: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('does NOT block POST /boards when title is valid — request reaches the controller', async () => {
    mockedRepo.createBoard.mockResolvedValue(mockBoard);

    const res = await request(app)
      .post('/boards')
      .send({ title: 'Valid Board' });

    // Middleware must pass valid requests through; controller returns 201
    expect(res.status).toBe(201);
    expect(mockedRepo.createBoard).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// PATCH /boards/:id — optional fields, middleware must not over-block
// ---------------------------------------------------------------------------

describe('PATCH /boards/:id input validation middleware', () => {
  it('returns 400 when request body is empty (no updatable fields provided)', async () => {
    const res = await request(app)
      .patch(`/boards/${BOARD_ID}`)
      .send({});

    // Empty PATCH body has no valid update intent; 400 is correct
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('does NOT block PATCH /boards/:id when title is provided', async () => {
    const updated = { ...mockBoard, title: 'Renamed Board' };
    mockedRepo.updateBoard.mockResolvedValue(updated);

    const res = await request(app)
      .patch(`/boards/${BOARD_ID}`)
      .send({ title: 'Renamed Board' });

    // Middleware must not interfere with valid PATCH requests
    expect(res.status).toBe(200);
    expect(mockedRepo.updateBoard).toHaveBeenCalledTimes(1);
  });
});
