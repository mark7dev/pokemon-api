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
            "official-artwork"?: { front_default: string | null };
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