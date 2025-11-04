import { Request, Response, NextFunction } from "express";

export class PokemonController {
    static getAllPokemons = (req: Request, res: Response, next: NextFunction): void => {
        try {
            // Logic to get all Pokemons
            res.status(200).json({ message: "List of all Pokemons" });
        } catch (error) {
            next(error);
        }
    }
}