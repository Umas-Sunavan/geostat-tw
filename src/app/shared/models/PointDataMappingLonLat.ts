import { Vector2 } from "three";
import { PointFromSheet } from "./PointFromSheet";

export interface PointDataMappingLonLat {
  lonLat: Vector2,
  pointData: PointFromSheet
}