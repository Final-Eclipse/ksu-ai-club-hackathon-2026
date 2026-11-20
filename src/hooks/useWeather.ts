import { useEffect, useState } from 'react';
import { CAMPUSES } from '../data/campuses';
import type { CampusId, WeatherSnapshot } from '../types';

interface OpenMeteoResponse {
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
}

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorms';
}

function cacheKey(campusId: CampusId, arrival: string): string {
  return `owlpark-weather-${campusId}-${arrival.slice(0, 13)}`;
}

export function useWeather(campusId: CampusId, arrival: string) {
  const [weather, setWeather] = useState<WeatherSnapshot>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    const campus = CAMPUSES[campusId];
    const key = cacheKey(campusId, arrival);

    async function loadWeather() {
      setLoading(true);
      setError(undefined);

      try {
        const cached = window.sessionStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached) as { savedAt: number; value: WeatherSnapshot };
          if (Date.now() - parsed.savedAt < 20 * 60_000) {
            setWeather(parsed.value);
            setLoading(false);
            return;
          }
        }

        const params = new URLSearchParams({
          latitude: String(campus.center.lat),
          longitude: String(campus.center.lng),
          hourly: 'temperature_2m,precipitation_probability,weather_code',
          temperature_unit: 'fahrenheit',
          timezone: 'America/New_York',
          forecast_days: '7',
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Weather service unavailable');
        const data = (await response.json()) as OpenMeteoResponse;
        const hourly = data.hourly;
        if (!hourly?.time.length) throw new Error('No hourly forecast returned');

        const targetHour = arrival.slice(0, 13);
        let index = hourly.time.findIndex((time) => time.startsWith(targetHour));
        if (index < 0) {
          const target = new Date(arrival).getTime();
          index = hourly.time.reduce((best, time, candidate) => {
            const bestTime = hourly.time[best];
            if (!bestTime) return candidate;
            const currentDistance = Math.abs(new Date(time).getTime() - target);
            const bestDistance = Math.abs(new Date(bestTime).getTime() - target);
            return currentDistance < bestDistance ? candidate : best;
          }, 0);
        }

        const temperature = hourly.temperature_2m[index];
        const precipitationProbability = hourly.precipitation_probability[index];
        const weatherCode = hourly.weather_code[index];
        const sourceTime = hourly.time[index];
        if (
          temperature === undefined ||
          precipitationProbability === undefined ||
          weatherCode === undefined ||
          sourceTime === undefined
        ) {
          throw new Error('Hourly weather data is incomplete');
        }
        const value: WeatherSnapshot = {
          temperatureF: Math.round(temperature),
          precipitationProbability: Math.round(precipitationProbability),
          weatherCode,
          condition: weatherLabel(weatherCode),
          sourceTime,
        };
        setWeather(value);
        window.sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), value }));
      } catch (reason) {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        setWeather(undefined);
        setError(reason instanceof Error ? reason.message : 'Weather unavailable');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadWeather().catch(() => setError('Weather unavailable'));
    return () => controller.abort();
  }, [arrival, campusId]);

  return { weather, loading, error };
}
