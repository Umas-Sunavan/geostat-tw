import { GoogleSheetPin } from "./PointFromSheet";
import { GeoencodingRaw } from "./Geoencoding";

export interface GoogleSheetPinMappingGeoencodingRaw {
    pointData: GoogleSheetPin;
    geoencodingRaw: GeoencodingRaw
}