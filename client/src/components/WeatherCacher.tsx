import Dexie from "dexie";

export interface CachedWeather {
  id?: number;
  lat: number;
  lon: number;
  date: string;
  selectedTypes: string[];
  data: Record<string, number[]>;
  timestamp: number;
}

export class WeatherCache extends Dexie {
  cachedWeather!: Dexie.Table<CachedWeather, number>;
  constructor() {
    super("WeatherCacheDB");
    this.version(2).stores({
    cachedWeather: "++id, [lat+lon+date], timestamp"
    }).upgrade(tx => {
        tx.table("cachedWeather").clear();
    });
  }
}

export const db = new WeatherCache();
