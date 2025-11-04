import { Request, Response, NextFunction } from 'express';
import { getAllPokemonsService, getPokemonByNameService } from '../services/pokemonService';

export class PokemonController {
  static getAllPokemons = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const pokemons = await getAllPokemonsService();
      res.json(pokemons);
    } catch (error) {
      next(error);
    }
  };

  static getPokemonByName = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { name } = req.params;
      const pokemon = await getPokemonByNameService(name);
      if (!pokemon) {
        res.status(404).json({ error: 'Pokemon not found' });
        return;
      }
      res.json(pokemon);
    } catch (error) {
      next(error);
    }
  }
}
