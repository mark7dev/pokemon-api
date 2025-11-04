import axios from "axios";
import { AppError } from "../middleware/errorHandler";
import { PokemonListResponse, PokemonBasicInfo, PokemonDetail, PokemonDTO, PokemonTypeInfo } from "../interfaces/pokemonInterfaces";
import { toAppError } from "../utils/axiosError";

const POKEAPI_BASE = process.env.POKEAPI_BASE || "https://pokeapi.co/api/v2";
const CACHE_TTL = Number(process.env.CACHE_TTL || 10 * 60 * 1000); // 10 min
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 50);

// Simple in-memory cache
let cacheData: PokemonDTO[] | null = null;
let cacheTimestamp = 0;

function isCacheValid(): boolean {
  return cacheData !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

async function fetchPokemonCount(): Promise<number> {
  try {
    const url = `${POKEAPI_BASE}/pokemon?limit=1`;
    const { data } = await axios.get<PokemonListResponse>(url);
    return data.count;
  } catch (error) {
    throw toAppError(error, 'Failed to fetch Pokemon count');
  }
}

async function fetchPokemonList(count: number): Promise<PokemonBasicInfo[]> {
  try {
    const url = `${POKEAPI_BASE}/pokemon?limit=${count}`;
    const { data } = await axios.get<PokemonListResponse>(url);
    return data.results;
  } catch (error) {
    throw toAppError(error, 'Failed to fetch Pokemon list');
  }
}

function getImage(detail: PokemonDetail): string | null {
  return (
    detail.sprites?.other?.dream_world?.front_default ??
    detail.sprites?.other?.home?.front_default ??
    detail.sprites?.other?.["official-artwork"]?.front_default ??
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
          const { data } = await axios.get<PokemonDetail>(url);
          return toDTO(data);
        })
      );
      result.push(...details);
    } catch (error) {
      throw toAppError(error, 'Failed to fetch Pokemon details in batch');
    }
  }

  return result;
}

export async function getAllPokemonsService() {

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