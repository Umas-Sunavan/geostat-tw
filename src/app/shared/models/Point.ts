import { Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial, PlaneGeometry, Vector2, Vector3 } from "three";
import { TileId } from "./TileId";

export interface Point {
    id: number;
    height: number;
    radius: number;
    color: number;
    title: string;
    address: string;
    position3d?: Vector3;
    positionTile?: Vector2;
    positionLongLat?: Vector2;
    mesh?: Mesh<PlaneGeometry, MeshStandardMaterial>
}