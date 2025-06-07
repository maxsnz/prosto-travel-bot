import fetch from "node-fetch";

type Response = {
  data: {
    id: number;
    attributes: {
      name: string;
      isComingSoon: boolean;
    };
  }[];
};

type City = { id: number; name: string };

let cities: City[] = [];

export async function loadCities(): Promise<void> {
  const retries = 3;
  const delayMs = 2000;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://prstrvl.ru/api/cities");
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = (await res.json()) as Response;

      cities = data.data
        .filter((item) => !item.attributes.isComingSoon)
        .map((item) => ({
          name: item.attributes.name,
          id: item.id,
        }));

      console.log(`✅ Cities loaded (${cities.length})`);
      return;
    } catch (err) {
      console.error(`⚠️ Attempt ${attempt} failed:`, err);

      if (attempt < retries) {
        console.log(`🔁 Retrying in ${delayMs} ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error(`❌ Failed to load cities after ${retries} attempts.`);
      }
    }
  }
}

export async function getCities(): Promise<City[]> {
  if (!cities) {
    await loadCities();
  }
  return cities;
}
