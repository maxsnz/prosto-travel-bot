import fetch from "node-fetch";

type Response = {
  data: {
    id: number;
    attributes: {
      name: string;
      address: string;
      description: string;
      mapLink: string;
      coords: string;
      imageUrl: string;
      tags: {
        name: string;
      }[];
    };
  }[];
};

export type Place = {
  id: number;
  name: string;
  address: string;
  description: string;
  mapLink: string;
  coords: string;
  imageUrl: string;
  tags: string[];
};

let placesByCity: { [id: number]: Place[] } = {};

export async function loadPlaces(cityId: number): Promise<void> {
  const retries = 3;
  const delayMs = 2000;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(
        `https://prstrvl.ru/api/places?filters[city][id][$eq]=${cityId}&populate=tags&pagination[pageSize]=1000`
      );
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = (await res.json()) as Response;

      const places = data.data.map((item) => ({
        name: item.attributes.name,
        id: item.id,
        address: item.attributes.address,
        description: item.attributes.description,
        mapLink: item.attributes.mapLink,
        coords: item.attributes.coords,
        tags: item.attributes.tags.map((tag) => tag.name),
        imageUrl: item.attributes.imageUrl,
      }));

      placesByCity[cityId] = places;

      return;
    } catch (err) {
      console.error(`Attempt ${attempt} failed:`, err);

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        console.error(`Failed to load cities after ${retries} attempts.`);
      }
    }
  }
}

export async function getPlaces(cityId: number): Promise<Place[]> {
  if (!placesByCity[cityId]) {
    await loadPlaces(cityId);
  }
  return placesByCity[cityId];
}
