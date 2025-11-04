import axios from 'axios';
import {
  PokemonListResponse,
  PokemonBasicInfo,
  PokemonDetail,
  PokemonDTO,
  PokemonFullDTO,
  PokemonFullDetail,
} from '../interfaces/pokemonInterfaces';
import { toAppError } from '../utils/axiosError';

const POKEAPI_BASE = process.env.POKEAPI_BASE || 'https://pokeapi.co/api/v2';
const CACHE_TTL = Number(process.env.CACHE_TTL || 10 * 60 * 1000); // 10 min
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 50);
const AXIOS_TIMEOUT_MS = Number(process.env.AXIOS_TIMEOUT_MS || 10000);

const http = axios.create({
  timeout: AXIOS_TIMEOUT_MS,
  // Avoid throwing on non-2xx automatically; we map errors via toAppError
  validateStatus: () => true,
});

// Simple in-memory cache
let cacheData: PokemonDTO[] | null = null;
let cacheTimestamp = 0;

function isCacheValid(): boolean {
  return cacheData !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

async function fetchPokemonCount(): Promise<number> {
  try {
    const url = `${POKEAPI_BASE}/pokemon?limit=1`;
    const { data, status, statusText } = await http.get<PokemonListResponse>(url);
    if (status < 200 || status >= 300) {
      throw new Error(statusText || 'Bad response');
    }
    return data.count;
  } catch (error) {
    throw toAppError(error, 'Failed to fetch Pokemon count');
  }
}

async function fetchPokemonList(count: number): Promise<PokemonBasicInfo[]> {
  try {
    const url = `${POKEAPI_BASE}/pokemon?limit=${count}`;
    const { data, status, statusText } = await http.get<PokemonListResponse>(url);
    if (status < 200 || status >= 300) {
      throw new Error(statusText || 'Bad response');
    }
    return data.results;
  } catch (error) {
    throw toAppError(error, 'Failed to fetch Pokemon list');
  }
}

function getImage(detail: PokemonDetail): string | null {
  return (
    detail.sprites?.other?.dream_world?.front_default ??
    detail.sprites?.other?.home?.front_default ??
    detail.sprites?.other?.['official-artwork']?.front_default ??
    detail.sprites?.front_default ??
    null
  );
}

function toDTO(detail: PokemonDetail): PokemonDTO {
  return {
    name: detail.name,
    types: detail.types.map((t) => t.type.name),
    image: getImage(detail),
  };
}

async function fetchDetailsInBatches(urls: string[]): Promise<PokemonDTO[]> {
  const result: PokemonDTO[] = [];

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    try {
      const details = await Promise.all(
        batch.map(async (url) => {
          const { data, status, statusText } = await http.get<PokemonDetail>(url);
          if (status < 200 || status >= 300) {
            throw new Error(statusText || 'Bad response');
          }
          return toDTO(data);
        }),
      );
      result.push(...details);
    } catch (error) {
      throw toAppError(error, 'Failed to fetch Pokemon details in batch');
    }
  }

  return result;
}

export async function getAllPokemonsService(): Promise<PokemonDTO[]> {
  if (isCacheValid() && cacheData !== null) {
    return cacheData;
  }

  const pokemonCount = await fetchPokemonCount();
  const pokemonList = await fetchPokemonList(pokemonCount);
  const pokemonUrls = pokemonList.map((element) => element.url);

  const allPokemon = await fetchDetailsInBatches(pokemonUrls);

  // Sort alphabetically by name for deterministic responses
  // allPokemon.sort((a, b) => a.name.localeCompare(b.name));

  // Store in cache
  cacheData = allPokemon;
  cacheTimestamp = Date.now();

  return allPokemon;
}

function getImages(detail: PokemonFullDetail): string[] {
  return [
    detail.sprites?.other?.dream_world?.front_default,
    detail.sprites?.other?.home?.front_default,
    detail.sprites?.other?.['official-artwork']?.front_default,
  ].filter((img): img is string => img !== null);
}

function toFullDTO(detail: PokemonFullDetail): PokemonFullDTO {
  return {
    id: detail.id,
    name: detail.name,
    height: detail.height,
    weight: detail.weight,
    base_experience: detail.base_experience,
    abilities: detail.abilities.map((a) => a.ability.name),
    types: detail.types.map((t) => t.type.name),
    images: getImages(detail),
    stats: {
      hp: detail.stats.find((s) => s.stat.name === 'hp')?.base_stat || 0,
      attack: detail.stats.find((s) => s.stat.name === 'attack')?.base_stat || 0,
      defense: detail.stats.find((s) => s.stat.name === 'defense')?.base_stat || 0,
      special_attack: detail.stats.find((s) => s.stat.name === 'special-attack')?.base_stat || 0,
      special_defense: detail.stats.find((s) => s.stat.name === 'special-defense')?.base_stat || 0,
      speed: detail.stats.find((s) => s.stat.name === 'speed')?.base_stat || 0,
    },
  };
}

async function fetchPokemonByName(name: string) {
  try {
    const url = `${POKEAPI_BASE}/pokemon/${name.toLowerCase()}`;
    const { data, status, statusText } = await http.get<PokemonFullDetail>(url);
    if (status < 200 || status >= 300) {
      throw new Error(statusText || 'Bad response');
    }
    return toFullDTO(data);
  } catch (error) {
    throw toAppError(error, 'Failed to fetch Pokemon list');
  }
}

export async function getPokemonByNameService(name: string): Promise<PokemonFullDTO> {
  const pokemon = await fetchPokemonByName(name);
  return pokemon;
}
