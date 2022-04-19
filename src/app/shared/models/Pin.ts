import { Group, Mesh, MeshBasicMaterial, MeshPhongMaterial, MeshStandardMaterial, PlaneGeometry, Vector2, Vector3 } from "three";
import { TileId } from "./TileId";

export interface Pin {
    id: number;
    height: number;
    title: string;
    address: string;
    position3d?: Vector3;
    positionTile?: Vector2;
    positionLongLat?: Vector2;
    mesh?: Group
}

export interface PinOnDeviceCoordinate extends Pin{
    deviceCoordinate?: Vector3
}