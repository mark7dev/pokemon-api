import request from 'supertest';
import type { PokemonDetail, PokemonListResponse } from '../interfaces/pokemonInterfaces';

// Mock axios to control external calls used by the service (which creates an instance via axios.create)
const getMock = jest.fn();
jest.mock('axios', () => {
  return {
    __esModule: true,
    default: {
      create: () => ({ get: getMock }),
    },
  };
});

import app from '../server';

describe('GET /api/pokemons (integration)', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('returns a sorted list of Pokemon DTOs', async () => {
    // 1) Count
    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { count: 2 } as PokemonListResponse });
    // 2) List
    getMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: {
        count: 2,
        next: null,
        previous: null,
        results: [
          { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1' },
          { name: 'arbok', url: 'https://pokeapi.co/api/v2/pokemon/24' },
        ],
      } as PokemonListResponse,
    });
    // 3) Details batched
    const bulba: PokemonDetail = {
      name: 'bulbasaur',
      types: [{ slot: 1, type: { name: 'grass', url: '' } }],
      sprites: { front_default: null, other: { home: { front_default: 'bulba.png' } } },
    };
    const arbok: PokemonDetail = {
      name: 'arbok',
      types: [{ slot: 1, type: { name: 'poison', url: '' } }],
      sprites: { front_default: 'arbok.png' },
    };
    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: bulba });
    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: arbok });

    const res = await request(app).get('/api/pokemons').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Sorted by name: arbok, bulbasaur
    expect(res.body.map((p: any) => p.name)).toEqual(['arbok', 'bulbasaur']);
    expect(res.body[0]).toEqual({ name: 'arbok', types: ['poison'], image: 'arbok.png' });
    expect(res.body[1]).toEqual({ name: 'bulbasaur', types: ['grass'], image: 'bulba.png' });
  });
});


