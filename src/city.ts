import fetch from "node-fetch";

type Response = {
  data: {
    id: number;
    attributes: {
      name: string;
      description: string;
    };
  };
};

export type City = {
  id: number;
  name: string;
  description: string;
};

let cities: { [id: number]: City } = {};

export async function loadCity(cityId: number): Promise<void> {
  const retries = 3;
  const delayMs = 2000;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`https://prstrvl.ru/api/cities/${cityId}`);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = (await res.json()) as Response;

      const city = {
        id: data.data.id,
        name: data.data.attributes.name,
        description: data.data.attributes.description,
      };

      cities[cityId] = city;

      return;
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err);

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error(`Failed to load cities after ${retries} attempts.`);
        throw err;
      }
    }
  }
}

export async function getCity(cityId: number): Promise<City> {
  if (!cities[cityId]) {
    await loadCity(cityId);
  }
  return cities[cityId];
}
