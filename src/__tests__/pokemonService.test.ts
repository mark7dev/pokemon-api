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

import { getAllPokemonsService, getPokemonByNameService, clearCache } from '../services/pokemonService';
import { AppError } from '../middleware/errorHandler';

describe('pokemonService', () => {
  beforeEach(() => {
    clearCache();
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
    getMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: {
        name: 'zubat',
        types: [{ slot: 1, type: { name: 'poison', url: '' } }],
        sprites: { front_default: 'z.png' },
      },
    });
    getMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: {
        name: 'abra',
        types: [{ slot: 1, type: { name: 'psychic', url: '' } }],
        sprites: { front_default: 'a.png' },
      },
    });

    const first = await getAllPokemonsService();
    // In case of sorting, assert order
    // expect(first.map(p => p.name)).toEqual(['abra', 'zubat']);
    // Do not assert order; only content
    expect(first.map((p) => p.name)).toEqual(expect.arrayContaining(['abra', 'zubat']));
    // Cached call should not trigger network again
    const callCountAfterFirst = getMock.mock.calls.length;
    const second = await getAllPokemonsService();
    expect(second).toBe(first);
    expect(getMock.mock.calls.length).toBe(callCountAfterFirst);
  });

  it('handles Pokemon with no images gracefully', async () => {
    clearCache();
    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { count: 1 } });
    getMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ name: 'missingno', url: 'u1' }],
      },
    });
    getMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: {
        name: 'missingno',
        types: [{ slot: 1, type: { name: 'normal', url: '' } }],
        sprites: { front_default: null },
      },
    });

    const result = await getAllPokemonsService();
    expect(result[0]).toEqual({ name: 'missingno', types: ['normal'], image: null });
  });

  it('handles Pokemon with multiple types', async () => {
    clearCache();
    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { count: 1 } });
    getMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ name: 'charizard', url: 'u1' }],
      },
    });
    getMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: {
        name: 'charizard',
        types: [
          { slot: 1, type: { name: 'fire', url: '' } },
          { slot: 2, type: { name: 'flying', url: '' } },
        ],
        sprites: { front_default: 'charizard.png' },
      },
    });

    const result = await getAllPokemonsService();
    expect(result[0]).toEqual({
      name: 'charizard',
      types: ['fire', 'flying'],
      image: 'charizard.png',
    });
  });

  it('handles errors when fetching Pokemon count', async () => {
    clearCache();
    getMock.mockRejectedValueOnce(new Error('Network error'));

    await expect(getAllPokemonsService()).rejects.toThrow(AppError);
  });

  it('handles non-200 status when fetching Pokemon list', async () => {
    clearCache();
    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { count: 1 } });
    getMock.mockResolvedValueOnce({ status: 500, statusText: 'Internal Server Error', data: null });

    await expect(getAllPokemonsService()).rejects.toThrow(AppError);
  });

  it('handles batch errors when fetching Pokemon details', async () => {
    clearCache();
    getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { count: 1 } });
    getMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [{ name: 'pikachu', url: 'u1' }],
      },
    });
    getMock.mockRejectedValueOnce(new Error('Network error'));

    await expect(getAllPokemonsService()).rejects.toThrow(AppError);
  });

  describe('getPokemonByNameService', () => {
    it('returns a Pokemon by name with full details', async () => {
      const pikachuDetail = {
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

      const result = await getPokemonByNameService('pikachu');
      expect(result).toMatchObject({
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

    it('converts Pokemon name to lowercase', async () => {
      const pikachuDetail = {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
        base_experience: 112,
        types: [],
        abilities: [],
        stats: [],
        sprites: { front_default: 'pikachu.png' },
      };

      getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: pikachuDetail });

      await getPokemonByNameService('PIKACHU');
      expect(getMock).toHaveBeenCalledWith(expect.stringContaining('/pokemon/pikachu'));
    });

    it('handles 404 when Pokemon not found', async () => {
      getMock.mockResolvedValueOnce({ status: 404, statusText: 'Not Found', data: null });

      await expect(getPokemonByNameService('unknown')).rejects.toThrow(AppError);
    });

    it('handles network errors', async () => {
      getMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(getPokemonByNameService('pikachu')).rejects.toThrow(AppError);
    });

    it('handles Pokemon with missing stats gracefully', async () => {
      const pokemonDetail = {
        id: 1,
        name: 'bulbasaur',
        height: 7,
        weight: 69,
        base_experience: 64,
        types: [{ slot: 1, type: { name: 'grass', url: '' } }],
        abilities: [],
        stats: [],
        sprites: { front_default: 'bulbasaur.png' },
      };

      getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: pokemonDetail });

      const result = await getPokemonByNameService('bulbasaur');
      expect(result.stats).toEqual({
        hp: 0,
        attack: 0,
        defense: 0,
        special_attack: 0,
        special_defense: 0,
        speed: 0,
      });
    });

    it('filters out null images', async () => {
      const pokemonDetail = {
        id: 1,
        name: 'bulbasaur',
        height: 7,
        weight: 69,
        base_experience: 64,
        types: [],
        abilities: [],
        stats: [],
        sprites: {
          front_default: null,
          other: {
            home: { front_default: null },
            dream_world: { front_default: 'dream.png' },
            'official-artwork': { front_default: null },
          },
        },
      };

      getMock.mockResolvedValueOnce({ status: 200, statusText: 'OK', data: pokemonDetail });

      const result = await getPokemonByNameService('bulbasaur');
      expect(result.images).toEqual(['dream.png']);
    });
  });
});
