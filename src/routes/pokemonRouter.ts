import { Router } from 'express';
import { PokemonController } from '../controllers/pokemonController';

const router = Router();

router.get('/', PokemonController.getAllPokemons);

export default router;
