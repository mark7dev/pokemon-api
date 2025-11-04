import axios from "axios";
import { AppError } from "../middleware/errorHandler";
import { PokemonListResponse, PokemonBasicInfo, PokemonDetail, PokemonDTO, PokemonTypeInfo } from "../interfaces/pokemonInterfaces";

const POKEAPI_BASE = process.env.POKEAPI_BASE || "https://pokeapi.co/api/v2";
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 50);

async function fetchPokemonCount(): Promise<number> {
  try {
    const url = `${POKEAPI_BASE}/pokemon?limit=1`;
    const { data } = await axios.get<PokemonListResponse>(url);
    return data.count;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      throw new AppError(
        `Failed to fetch Pokemon count: ${axiosError.message}`,
        503
      );
    }
    throw error;
  }
}

async function fetchPokemonList(count: number): Promise<PokemonBasicInfo[]> {
  try {
    const url = `${POKEAPI_BASE}/pokemon?limit=${count}`;
    const { data } = await axios.get<PokemonListResponse>(url);
    return data.results;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      throw new AppError(
        `Failed to fetch Pokemon list: ${axiosError.message}`,
        503
      );
    }
    throw error;
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
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        throw new AppError(
          `Failed to fetch Pokemon details in batch: ${axiosError.message}`,
          503
        );
      }
      throw error;
    }
  }

  return result;
}

export async function getAllPokemonsService() {
  const pokemonCount = await fetchPokemonCount();
  const pokemonList = await fetchPokemonList(pokemonCount);
  const pokemonUrls = pokemonList.map((element) => element.url);

  const allPokemon = await fetchDetailsInBatches(pokemonUrls);

  // Sort alphabetically by name
  // allPokemon.sort((a, b) => a.name.localeCompare(b.name));

  return allPokemon;
}