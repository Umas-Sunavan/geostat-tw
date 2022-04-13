export interface PointDimensionFromSheet {
  id: number; // id is the row number on google sheet, starting with 0
  dimensionData: string;
  title: string;
}