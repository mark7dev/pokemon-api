import axios from "axios";
import { AppError } from "../middleware/errorHandler";
import { PokemonListResponse, PokemonBasicInfo } from "../interfaces/pokemonInterfaces";

const POKEAPI_BASE = process.env.POKEAPI_BASE || "https://pokeapi.co/api/v2";

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

export async function getAllPokemonsService() {
  const count = await fetchPokemonCount();
  const baseList = await fetchPokemonList(count);
  console.log(`Fetched ${baseList.length} pokemons from PokeAPI`);
  return baseList;
}