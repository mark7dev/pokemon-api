import { Router } from 'express';
import { PokemonController } from '../controllers/pokemonController';

const router = Router();

router.get('/', PokemonController.getAllPokemons);
router.get('/:name', PokemonController.getPokemonByName);

export default router;
