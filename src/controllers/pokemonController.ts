import { Request, Response, NextFunction } from "express";
import { getAllPokemonsService } from "../services/pokemonService";

export class PokemonController {
    static getAllPokemons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const pokemons = await getAllPokemonsService();
            res.json(pokemons);
        } catch (error) {
            next(error);
        }
    }
}