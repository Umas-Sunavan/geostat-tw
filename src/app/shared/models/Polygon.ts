import { Color, Mesh, Vector3 } from "three";
import { Pin } from "./Pin";

export interface Polygon {
  id:string,
  points: Pin[]
  color: number
  opacity: number
  mesh?: Mesh
}