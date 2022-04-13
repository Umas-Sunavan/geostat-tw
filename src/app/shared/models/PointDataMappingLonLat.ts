import { Vector2 } from "three";
import { GoogleSheetPin } from "./PointFromSheet";

export interface GoogleSheetPinMappingLonLat {
  lonLat: Vector2,
  pointData: GoogleSheetPin
}