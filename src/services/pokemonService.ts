import axios from "axios";
import { AppError } from "../middleware/errorHandler";
import { PokemonListResponse } from "../interfaces/pokemonInterfaces";

const POKEAPI_BASE = process.env.POKEAPI_BASE || "https://pokeapi.co/api/v2";

async function fetchCount(): Promise<number> {
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

export async function getAllPokemonsService() {
    try {
        const response = await axios.get(`${POKEAPI_BASE}/pokemon?limit=1500`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching all Pokemons");
    }
}