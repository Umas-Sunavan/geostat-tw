import { Location } from "./Geoencoding";

export interface GeoencodingCache {
  id: string,
  lat: string,
  lon: string,
  title: string,
  address: string
}