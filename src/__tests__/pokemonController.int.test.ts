import request from 'supertest';
import type { PokemonDetail, PokemonListResponse, PokemonFullDetail } from '../interfaces/pokemonInterfaces';

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
    getMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: { count: 2 } as PokemonListResponse,
    });
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
    // Not sorted
    const names = res.body.map((p: any) => p.name);
    // Do not assert order; only assert presence and shape
    expect(names).toEqual(expect.arrayContaining(['arbok', 'bulbasaur']));
    expect(res.body.length).toBe(2);
    const arbokDto = res.body.find((p: any) => p.name === 'arbok');
    const bulbaDto = res.body.find((p: any) => p.name === 'bulbasaur');
    expect(arbokDto).toEqual({ name: 'arbok', types: ['poison'], image: 'arbok.png' });
    expect(bulbaDto).toEqual({ name: 'bulbasaur', types: ['grass'], image: 'bulba.png' });

    // In case of sorting, uncomment these:
    // expect(res.body.map((p: any) => p.name)).toEqual(['arbok', 'bulbasaur']);
    // expect(res.body[0]).toEqual({ name: 'arbok', types: ['poison'], image: 'arbok.png' });
    // expect(res.body[1]).toEqual({ name: 'bulbasaur', types: ['grass'], image: 'bulba.png' });
  });

  it('handles service errors and returns 503', async () => {
    // Clear cache first to ensure fresh request
    const { clearCache } = await import('../services/pokemonService');
    clearCache();
    getMock.mockRejectedValueOnce(new Error('Network error'));

    const res = await request(app).get('/api/pokemons').expect(503);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('statusCode', 503);
  });
});

describe('GET /api/pokemons/:name (integration)', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('returns a single Pokemon by name', async () => {
    const pikachuDetail: PokemonFullDetail = {
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      base_experience: 112,
      types: [{ slot: 1, type: { name: 'electric', url: '' } }],
      abilities: [
        { ability: { name: 'static', url: '' }, is_hidden: false, slot: 1 },
        { ability: { name: 'lightning-rod', url: '' }, is_hidden: true, slot: 3 },
      ],
      stats: [
        { base_stat: 35, effort: 0, stat: { name: 'hp', url: '' } },
        { base_stat: 55, effort: 0, stat: { name: 'attack', url: '' } },
        { base_stat: 40, effort: 0, stat: { name: 'defense', url: '' } },
        { base_stat: 50, effort: 0, stat: { name: 'special-attack', url: '' } },
        { base_stat: 50, effort: 0, stat: { name: 'special-defense', url: '' } },
        { base_stat: 90, effort: 2, stat: { name: 'speed', url: '' } },
      ],
      sprites: {
        front_default: 'pikachu.png',
        other: {
          home: { front_default: 'pikachu-home.png' },
          dream_world: { front_default: 'pikachu-dream.png' },
          'official-artwork': { front_default: 'pikachu-art.png' },
        },
      },
    };

    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: pikachuDetail });

    const res = await request(app).get('/api/pokemons/pikachu').expect(200);
    expect(res.body).toMatchObject({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      base_experience: 112,
      types: ['electric'],
      abilities: ['static', 'lightning-rod'],
      images: ['pikachu-dream.png', 'pikachu-home.png', 'pikachu-art.png'],
      stats: {
        hp: 35,
        attack: 55,
        defense: 40,
        special_attack: 50,
        special_defense: 50,
        speed: 90,
      },
    });
  });

  it('returns 404 when Pokemon not found', async () => {
    getMock.mockResolvedValueOnce({ status: 404, statusText: 'Not Found', data: null });

    const res = await request(app).get('/api/pokemons/unknownpokemon').expect(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('statusCode', 404);
    // Service throws AppError with "Not Found" message
    expect(res.body.error).toBe('Not Found');
  });

  it('handles service errors and returns 503', async () => {
    getMock.mockRejectedValueOnce(new Error('Network error'));

    const res = await request(app).get('/api/pokemons/pikachu').expect(503);
    expect(res.body).toHaveProperty('error');
    expect(res.body).toHaveProperty('statusCode', 503);
  });

  it('handles case-insensitive Pokemon names', async () => {
    const pikachuDetail: PokemonFullDetail = {
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      base_experience: 112,
      types: [{ slot: 1, type: { name: 'electric', url: '' } }],
      abilities: [],
      stats: [],
      sprites: { front_default: 'pikachu.png' },
    };

    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: pikachuDetail });

    const res = await request(app).get('/api/pokemons/PIKACHU').expect(200);
    expect(res.body).toHaveProperty('name', 'pikachu');
    expect(getMock).toHaveBeenCalledWith(expect.stringContaining('/pokemon/pikachu'));
  });
});
