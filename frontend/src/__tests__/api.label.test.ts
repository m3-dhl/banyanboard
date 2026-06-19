/**
 * Regression tests for label API functions in api.ts.
 *
 * Regression for TASK-013: createLabel was posting to /boards/:boardId/labels
 * (which does not exist on the backend) instead of /labels with boardId in the
 * request body. The fix makes both the URL and the payload match what the
 * backend label.routes.ts expects.
 */
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createLabel, fetchLabels } from '../api'

const BOARD_ID = 'a0000000-0000-0000-0000-000000000001'
const mockLabel = {
  id: 'c2222222-2222-2222-2222-222222222222',
  name: 'Bug',
  color: '#c0392b',
  boardId: BOARD_ID,
  createdAt: '2026-06-16T10:00:00.000Z',
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// createLabel — URL and body regression (TASK-013)
// ---------------------------------------------------------------------------

describe('createLabel', () => {
  it('POSTs to /labels (not /boards/:boardId/labels)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockLabel,
    } as unknown as Response)

    await createLabel(BOARD_ID, 'Bug', '#C0392B')

    const [calledUrl] = vi.mocked(fetch).mock.calls[0]
    // Must NOT contain /boards/
    expect(String(calledUrl)).not.toContain('/boards/')
    // Must end with /labels
    expect(String(calledUrl)).toMatch(/\/labels$/)
  })

  it('includes boardId in the POST request body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockLabel,
    } as unknown as Response)

    await createLabel(BOARD_ID, 'Bug', '#C0392B')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>
    expect(body.boardId).toBe(BOARD_ID)
    expect(body.name).toBe('Bug')
    expect(body.color).toBe('#C0392B')
  })

  it('returns the label object returned by the server', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockLabel,
    } as unknown as Response)

    const result = await createLabel(BOARD_ID, 'Bug', '#C0392B')
    expect(result).toEqual(mockLabel)
  })

  it('throws when the server responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
    } as unknown as Response)

    await expect(createLabel(BOARD_ID, '', '#C0392B')).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// fetchLabels — URL regression (TASK-013)
// ---------------------------------------------------------------------------

describe('fetchLabels', () => {
  it('GETs /labels?boardId=… (not /boards/:boardId/labels)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [mockLabel],
    } as unknown as Response)

    await fetchLabels(BOARD_ID)

    const [calledUrl] = vi.mocked(fetch).mock.calls[0]
    // Must NOT use the nested boards path
    expect(String(calledUrl)).not.toMatch(/\/boards\/[^/]+\/labels/)
    // Must include boardId as a query param
    expect(String(calledUrl)).toContain(`boardId=${BOARD_ID}`)
  })

  it('returns the array of labels from the server', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [mockLabel],
    } as unknown as Response)

    const result = await fetchLabels(BOARD_ID)
    expect(result).toEqual([mockLabel])
  })

  it('throws when the server responds with a non-ok status', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
    } as unknown as Response)

    await expect(fetchLabels(BOARD_ID)).rejects.toThrow()
  })
})
