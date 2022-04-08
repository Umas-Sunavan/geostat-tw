import { PointFromSheet } from "./PointFromSheet";
import { GeoencodingRaw } from "./Geoencoding";

export interface PointDataMappingGeoencodingRaw {
    pointData: PointFromSheet;
    geoencodingRaw: GeoencodingRaw
}