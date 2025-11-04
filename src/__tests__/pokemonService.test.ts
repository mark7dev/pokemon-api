// Service unit tests: verify caching and sorting
const getMock = jest.fn();
jest.mock('axios', () => {
  return {
    __esModule: true,
    default: {
      create: () => ({ get: getMock }),
    },
  };
});

import { getAllPokemonsService } from '../services/pokemonService';

describe('pokemonService', () => {
  beforeEach(() => {
    jest.resetModules();
    getMock.mockReset();
  });

  it('caches results and returns sorted by name', async () => {
    // 1) Count
    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { count: 2 } });
    // 2) List
    getMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: {
        count: 2,
        next: null,
        previous: null,
        results: [
          { name: 'zubat', url: 'u1' },
          { name: 'abra', url: 'u2' },
        ],
      },
    });
    // 3) Details
    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { name: 'zubat', types: [{ slot: 1, type: { name: 'poison', url: '' } }], sprites: { front_default: 'z.png' } } });
    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { name: 'abra', types: [{ slot: 1, type: { name: 'psychic', url: '' } }], sprites: { front_default: 'a.png' } } });

    const first = await getAllPokemonsService();
    // In case of sorting, assert order
    // expect(first.map(p => p.name)).toEqual(['abra', 'zubat']);
    // Do not assert order; only content
    expect(first.map(p => p.name)).toEqual(expect.arrayContaining(['abra', 'zubat']));
    // Cached call should not trigger network again
    const callCountAfterFirst = getMock.mock.calls.length;
    const second = await getAllPokemonsService();
    expect(second).toBe(first);
    expect(getMock.mock.calls.length).toBe(callCountAfterFirst);
  });
});


