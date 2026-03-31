export interface NominatimResult {
    osm_type: string;
    osm_id: string;
    name?: string;
    display_name?: string;
    lat: string;
    lon: string;
}

export interface WikiCommonsPage {
    imageinfo?: {
        url?: string;
        extmetadata?: { Artist?: { value?: string } };
    }[];
}

export interface HourlyWeather {
    hour: number;
    temp: number;
    main: string;
    precipitationProbability: number;
}

export interface WeatherData {
    type: "forecast" | "climate";
    main: string;
    description: string;
    temp: number;
    tempMin?: number;
    tempMax?: number;
    precipitationProbabilityMax?: number;
    precipitationSum?: number;
    windMax?: number;
    sunrise?: string;
    sunset?: string;
    hourly?: HourlyWeather[];
}

export interface OpenMeteoForecast {
    error?: boolean;
    reason?: string;
    current?: { temperature_2m: number; weathercode: number };
    daily?: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        weathercode: number[];
        precipitation_sum?: number[];
        precipitation_probability_max?: number[];
        windspeed_10m_max?: number[];
        sunrise?: string[];
        sunset?: string[];
    };
    hourly?: {
        time: string[];
        temperature_2m: number[];
        precipitation_probability?: number[];
        precipitation?: number[];
        weathercode?: number[];
        windspeed_10m?: number[];
        relativehumidity_2m?: number[];
    };
}
