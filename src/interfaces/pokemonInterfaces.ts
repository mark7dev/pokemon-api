export interface PokemonBasicInfo {
  name: string;
  url: string;
}

export interface PokemonTypeInfo {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonBasicInfo[];
}

export interface PokemonDetail {
  name: string;
  types: PokemonTypeInfo[];
  sprites: {
    front_default: string | null;
    other?: {
      'official-artwork'?: { front_default: string | null };
      dream_world?: { front_default: string | null };
      home?: { front_default: string | null };
    };
  };
}

export interface PokemonDTO {
  name: string;
  types: string[];
  image: string | null;
}

export interface PokemonAbility {
  ability: {
    name: string;
    url: string;
  };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonFullDetail extends PokemonDetail {
  id: number;
  height: number;
  weight: number;
  base_experience: number;
  abilities: PokemonAbility[];
  stats: PokemonStat[];
}

export interface PokemonFullDTO {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  abilities: string[];
  types: string[];
  images: string[];
  stats: {
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
  };
}
