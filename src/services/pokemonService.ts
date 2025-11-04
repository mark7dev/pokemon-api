import axios from "axios";

const POKEAPI_BASE = process.env.POKEAPI_BASE || "https://pokeapi.co/api/v2";

export async function getAllPokemonsService() {
    try {
        const response = await axios.get(`${POKEAPI_BASE}/pokemon?limit=1500`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching all Pokemons");
    }
}