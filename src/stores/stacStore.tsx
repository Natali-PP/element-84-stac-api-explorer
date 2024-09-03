import { create } from "zustand";
interface STACFeature {
  type: "Feature";
  stac_version: string;
  id: string;
  properties: {
    platform: string;
    instruments: string[];
    created: string;
    gsd: number;
    description: string;
    "eo:cloud_cover": number;
    "view:off_nadir": number;
    "view:sun_elevation": number;
    "view:sun_azimuth": number;
    "proj:epsg": number;
    "proj:shape": number[];
    "proj:transform": number[];
    "proj:centroid": {
      lat: number;
      lon: number;
    };
    "landsat:cloud_cover_land": number;
    "landsat:wrs_type": string;
    "landsat:wrs_path": string;
    "landsat:wrs_row": string;
    "landsat:collection_category": string;
    "landsat:collection_number": string;
    "landsat:correction": string;
    "landsat:scene_id": string;
    "landsat:product_generated": string;
    "grid:code": string;
    "sci:doi": string;
    datetime: string;
    "earthsearch:payload_id": string;
    "processing:software": {
      "landsat-to-stac": string;
    };
    updated: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  links: {
    rel: string;
    type: string;
    href: string;
    title?: string;
  }[];
  assets: {
    [key: string]: {
      href: string;
      type: string;
      title?: string;
    };
  };
  bbox: [number, number, number, number];
  stac_extensions: string[];
  collection: string;
}

interface STACContext {
  limit: number;
  matched: number;
  returned: number;
}

interface STACLink {
  rel: string;
  title?: string;
  method?: string;
  type: string;
  href: string;
  merge?: boolean;
  body?: {
    datetime?: string;
    intersects?: {
      type: "Polygon";
      coordinates: number[][][];
    };
    limit?: number;
    next?: string;
  };
}

interface STACFeatureCollectionResponse {
  type: "FeatureCollection";
  stac_version: string;
  stac_extensions: string[];
  context: STACContext;
  numberMatched: number;
  numberReturned: number;
  features: STACFeature[];
  links: STACLink[];
}

interface STACStoreState {
  features: STACFeature[];
  bbox: number[];
  updateFeatures: (by: []) => void;
  position: { latitude: number; longitude: number };
  setPosition: (position: { latitude: number; longitude: number }) => void;
  featureCollectionResponse: STACFeatureCollectionResponse | null;
  updateFeatureCollectionResponse: (
    by: STACFeatureCollectionResponse | null
  ) => void;
  selectedFeatureInMap: STACFeature | null;
  updateSelectedFeatureInMap: (feature: STACFeature | null) => void;
  isMapImageVisible: boolean;
  toggleMapImageVisibility: () => void;
}
const useSTACStore = create<STACStoreState>()((set) => ({
  features: [],
  bbox: [-180, -90, 180, 90],
  updateFeatures: (by: []) => set(() => ({ features: by })),
  updateBBox: (by: number[]) => set(() => ({ bbox: by })),
  position: { latitude: 0, longitude: 0 },
  setPosition: (position) => set({ position }),
  featureCollectionResponse: null,
  updateFeatureCollectionResponse: (by: STACFeatureCollectionResponse | null) =>
    set(() => ({ featureCollectionResponse: by })),
  selectedFeatureInMap: null,
  updateSelectedFeatureInMap: (feature: STACFeature | null) =>
    set((state) => ({
      selectedFeatureInMap: feature,
      isMapImageVisible:
        state.selectedFeatureInMap?.id === feature?.id
          ? !state.isMapImageVisible
          : true,
    })),
  isMapImageVisible: false,
  toggleMapImageVisibility: () =>
    set((state) => ({ isMapImageVisible: !state.isMapImageVisible })),
}));

export default useSTACStore;
