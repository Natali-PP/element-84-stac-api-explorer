export const readableDate = (isoDate: string) => {
  const date = new Date(isoDate);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    timeZoneName: "short",
  });
};

export const convertS3ToHttp = (s3Url: string): string => {
  return s3Url
    .replace("s3://", "https://")
    .replace(/\/(.*?\/)/, ".s3.amazonaws.com/$1");
};

export function calculateBboxCenter(
  bbox: [number, number, number, number]
): [number, number] {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const centerLon = (minLon + maxLon) / 2;
  const centerLat = (minLat + maxLat) / 2;

  return [centerLon, centerLat];
}

export const formatCoordinatesRasterImages = (bbox: number[]) => {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const coordinates = [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
  ];
  return coordinates;
};
