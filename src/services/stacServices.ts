import axios from "axios";

//const STAC_API_URL = "https://earth-search.aws.element84.com/v1/search";
const STAC_API_URL = "https://earth-search.aws.element84.com/v1";

interface STACQuery {
  bbox?: number[];
  datetime: string;
  limit?: number;
  collections?: string[];
  intersects?: { type: string; coordinates: {} }; // New field for polygon geometry
}

export const searchSTAC = async (query: STACQuery) => {
  try {
    const response = await axios.post(`${STAC_API_URL}/search`, query, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching STAC data:", error);
    throw error;
  }
};

export interface STACItem {
  id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: {
    datetime: string;
    // Add more properties based on STAC specification
  };
  assets: {
    [key: string]: {
      href: string;
      type: string;
    };
  };
}

export interface STACResponse {
  type: string;
  features: STACItem[];
  // Add other fields as needed
}
