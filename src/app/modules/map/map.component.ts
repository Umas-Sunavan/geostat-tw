import { AfterContentInit, AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TileId } from 'src/app/shared/models/TileId';
import { BoxGeometry, BufferGeometry, Camera, Color, CurvePath, ExtrudeBufferGeometry, ExtrudeGeometry, Line, LineBasicMaterial, LineCurve, Material, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshPhongMaterial, MeshStandardMaterial, Object3D, PerspectiveCamera, PlaneGeometry, PointLight, Raycaster, Renderer, Scene, Shape, ShapeBufferGeometry, ShapeGeometry, Vector, Vector2, Vector3, Vector3Tuple, WebGLRenderer, DoubleSide, Texture, Plane, WebGLRenderTarget, TextureLoader, Intersection } from 'three';
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { AnimateService } from './three-services/animate.service';
import { CameraService } from './three-services/camera.service';
import { LightService } from './three-services/light.service';
import { RendererService } from './three-services/renderer.service';
import { SceneService } from './three-services/scene.service';
import { TileService } from './tile-services/tile.service';
import { Tile } from 'src/app/shared/models/Tile';
import { TextureService } from './tile-services/texture.service';
import { BehaviorSubject, concatMap, delay, exhaustMap, filter, interval, last, lastValueFrom, map, Observable, of, Subject, Subscriber, switchMap, take, tap } from 'rxjs';
import { TileUtilsService } from './tile-services/tile-utils.service';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.sass']
})
export class MapComponent implements OnInit, AfterViewInit {

  constructor(
    private sceneService: SceneService,
    private rendererService: RendererService,
    private cameraService: CameraService,
    private animateService: AnimateService,
    private lightService: LightService,
    private tileService: TileService,
    private textureService: TextureService,
    private tileUtilsService: TileUtilsService,
  ) {
    this.initQueueToUpdateResolution()
  }

  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLCanvasElement>;
  scene: Scene = new Scene()
  renderer: WebGLRenderer = new WebGLRenderer()
  camera: Camera = new PerspectiveCamera()
  orbitControl!: OrbitControls
  box?: Object3D
  box2?: Object3D
  ground!: Object3D
  mousePosition: Vector2 = new Vector2(0, 0)
  plane!: Object3D
  tiles: Tile[] = []
  lines: Line<BufferGeometry, LineBasicMaterial>[] = []
  onUserUpdateCamera: Subject<string> = new BehaviorSubject('')
  queueToUpdateResolution!: Observable<string>
  

  initQueueToUpdateResolution = () => {
    this.queueToUpdateResolution = new Observable(subscriber => {
      this.updateTilesResolution().then(next => {
        subscriber.next(next)
      })
    })
  }

  ngOnInit(): void {
    this.initOnUserUpdateResolution()
  }

  initOnUserUpdateResolution = () => {
    this.onUserUpdateCamera.pipe(
      switchMap(value => of(value).pipe(delay(1000))) // abandon too-frequent emission
    ).pipe(
      concatMap(() => this.queueToUpdateResolution.pipe(take(1))) // add emission to queue
    ).subscribe()
  }

  async ngAfterViewInit() {
    this.initThree()
    await this.initTile()
  }

  getBox = () => {
    const boxGeo = new BoxGeometry(5, 5, 5)
    const boxMaterial = new MeshBasicMaterial({ color: 0xff0000 })
    const box = new Mesh(boxGeo, boxMaterial)
    return box
  }

  initThree = () => {
    const canvasDimention = new Vector2(600, 450)
    this.scene = this.sceneService.makeScene()
    this.renderer = this.rendererService.makeRenderer(this.canvasContainer, canvasDimention)
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove)
    this.canvasContainer.nativeElement.addEventListener('mousewheel', this.onMouseScroll)
    this.canvasContainer.nativeElement.addEventListener('mouseup', this.onMouseUp)
    this.camera = this.cameraService.makeCamera(canvasDimention)
    this.scene.add(this.camera)
    this.orbitControl = new OrbitControls(this.camera, this.renderer.domElement);
    this.animateService.animate(this.renderer, this.scene, this.camera, this.orbitControl, this.mousePosition, 600)
    this.animateService.initAnimate(this.renderer)
    this.box = this.getBox()
    this.plane = this.tileService.getPlane()
    this.plane.rotateX(-Math.PI * 0.5)
    this.plane.position.setY(-0.1)
    this.scene.add(this.box)
    this.scene.add(this.plane)

    this.animateService.onFrameRender.subscribe(({ renderer, raycaster }) => {
      // console.log(this.camera.position);
      // this.camera.position
    })
    this.lightService.makeLight(this.scene)
  }

  onMouseMove = async (event: MouseEvent) => {
    const newPosition = this.rendererService.updateMouse(event)
    this.animateService.updateMouse(newPosition)
    this.mousePosition.set(newPosition.x, newPosition.y)
  }

  initTile = async () => {
    const initTileId = this.tileService.initTileId
    const tileIds = this.tileService.getTileIdsOfLevel8(initTileId)
    // const tilesWithoutMesh = tileIds.map((id): Tile => { return { id: id, mesh: undefined } })
    const tiles = await this.getTileMeshById(tileIds, initTileId)
    this.updateTileToRaycaster(tiles)
    this.tiles = tiles
    this.addTilesToScene(tiles)
  }

  getTileMesh = async (tiles: Tile[], initTileId: TileId) => {
    this.tileService.initTileMesh(tiles, initTileId)
    await this.textureService.applyMockTexture(tiles)
    // await this.textureService.applyDisplacementTexture(tiles)
    return tiles
  }

  getTileMeshById = async (tileIds: TileId[], initTileId: TileId) => {
    const tiles = this.tileService.initTileMeshById(tileIds, initTileId)
    await this.textureService.applyMockTexture(tiles)
    // await this.textureService.applyDisplacementTexture(tiles)
    return tiles
  }

  updateTileToRaycaster = (tiles: Tile[]) => {
    const objToDetectIntersect = tiles.map(tile => tile.mesh as Object3D)
    this.animateService.passIntersetObject(objToDetectIntersect)
  }

  addTilesToScene = (tiles: Tile[]) => {
    tiles.forEach(tile => {
      if (!tile.mesh) throw new Error("no mesh to add to scene");
      const tile3d = tile.mesh as Object3D
      this.scene.add(tile3d)
    })
  }

  addChildTile = async (parentTileIds: TileId[]) => {
    const newTileIds = this.tileUtilsService.calculateChildTileIdsFromIds(parentTileIds)
    await this.addTilesById(newTileIds, this.tiles)
  }

  addTilesById = async (tileIds: TileId[], tiles: Tile[]) => {
    // including adding to the scene and model(binding data)
    const newTiles = await this.getTileMeshById(tileIds, this.tileService.initTileId)
    tiles.push(...newTiles)
    this.updateTileToRaycaster(tiles)
    this.addTilesToScene(newTiles)
    return tiles
  }

  onMouseScroll = async () => {
    this.onUserUpdateCamera.next('')
  }

  onMouseUp = async () => {
    this.onUserUpdateCamera.next('')
  }

  updateTilesResolution = async () => {
    const getMergingTiles = (fromTiles: Tile[], cameraPosition: Vector3, canvasCenter: Vector3) => {
      const tilesFarToCamera = this.tilesFarToCamera(fromTiles, cameraPosition)
      const tilesToTurnParent = this.tileUtilsService.tilesFarToCanvasCenter(fromTiles, canvasCenter)
      let tilesToMerge: Tile[] = []
      tilesToMerge.push(...tilesToTurnParent, ...tilesFarToCamera)
      tilesToMerge = this.makeUniqueTilesByIds(tilesToMerge)
      tilesToMerge = this.checkSiblingsCanMerge(tilesToMerge, canvasCenter)
      tilesToMerge = tilesToMerge.filter( tile => tile.id.z > 8)
      return tilesToMerge
    }
    const splitTiles = async (fromTiles: Tile[], canvasCenter: Vector3) => {
      const tilesToSplit = this.tileUtilsService.tilesCloseToCanvasCenter(fromTiles, canvasCenter)
      const cameraZoomedEnough = this.tileUtilsService.isAnyTileCloseToCamera(tilesToSplit, this.camera)
      if (tilesToSplit) {
        if (cameraZoomedEnough) {
          try {
            const tileIdsToSplit = tilesToSplit.map( tile => tile.id)
            await this.addChildTile(tileIdsToSplit)
            this.tiles = this.tileUtilsService.removeTileByIds(tileIdsToSplit, this.tiles, this.scene)
          } catch (error) {
            console.warn('abandon removing ', tilesToSplit.map(tile => JSON.stringify(tile.id)).join(', '));
          }
        }
      }
    }
    const canvasCenter: Vector3 | undefined = this.animateService.getCanvasCenter()
    if (canvasCenter) {
      await splitTiles(this.tiles, canvasCenter)
      let tilesToMerge = getMergingTiles(this.tiles, this.camera.position, canvasCenter)
      while (tilesToMerge.length !== 0) {
        console.log(tilesToMerge);
        await this.mergeTile(tilesToMerge)
        tilesToMerge = getMergingTiles(this.tiles, this.camera.position, canvasCenter)
      }
    }
    return ''
  }

  tilesFarToCamera = (tiles: Tile[], camera: Vector3) => {
    return tiles.filter(tile => {
      if (tile.mesh) {
        const distance = new Vector3().subVectors(tile.mesh.position, camera).length()
        const threshold = this.tileUtilsService.getDistanceThresholdOfTileToCamera(tile)
        return distance > threshold * 10
      }
      throw new Error("there are tiles missing mesh in runtime");

    })
  }

  makeUniqueTiles = (array: TileId[]) => {
    const uniqueArray: TileId[] = []
    array.forEach(tileId => {
        const isDuplicate = uniqueArray.some(id => this.tileUtilsService.isTileIdEqual(id, tileId))
        if (!isDuplicate) {
          uniqueArray.push(tileId)
        }
    })
    return uniqueArray
  }

  makeUniqueTilesByIds = (array: Tile[]) => {
    const uniqueArray: Tile[] = []
    array.forEach(tile => {
        const isDuplicate = uniqueArray.some(uniqueTile => this.tileUtilsService.isTileIdEqual(tile.id, uniqueTile.id))
        if (!isDuplicate) {
          uniqueArray.push(tile)
        }
    })
    return uniqueArray
  }

  mergeTile = async (tilesToMerge: Tile[]) => {

    const addTilesByIds = async (tileIds: TileId[]) => {
      for (const tileId of tileIds) {
        if (tileId.z > 7) {
          await this.addTilesById([tileId], this.tiles)
        }
      }
    }

    const hideTiles = async (tiles: Tile[]) => {
      for (const tile of tiles) {
        if (tile.id.z > 7) {
          if (tile.mesh) {
            tile.mesh.traverse(object3d => {
              object3d.visible = false
            })
          }
        }
      }
    }

    const removeTiles = (tileIds: TileId[]) => {
      for (const id of tileIds) {
        const tile = this.tileUtilsService.getTileById(this.tiles, id)
        if (tile?.mesh) {
          if (tile.id.z > 8) {
            this.tiles = this.tileUtilsService.removeTile(tile, this.tiles)
          }
        } else {
          throw new Error("incorrect tile mesh mapping");
        }
      } 
    }

    const showTiles = (tileIds: TileId[]) => {
      for (const tileId of tileIds) {
        const tile = this.tiles.find(tile => this.tileUtilsService.isTileIdEqual(tile.id, tileId))
        if (tile?.mesh) {
          tile.mesh.traverse(object3d => {
            object3d.visible = true
          })
        }
      }
    }

    const parentTileIdsToAdd = tilesToMerge.map( parentTile => this.tileUtilsService.getIdFromChildTile(parentTile.id))
    const uniqueParentTileIdsToAdd = this.makeUniqueTiles(parentTileIdsToAdd)
    const childTileIds = this.tileUtilsService.calculateChildTileIdsFromIds(uniqueParentTileIdsToAdd)
    const uniqueParentTileToAdd = uniqueParentTileIdsToAdd.map( tileId => {return {id: tileId} as Tile})
    await addTilesByIds(uniqueParentTileIdsToAdd)
    hideTiles(uniqueParentTileToAdd)
    removeTiles(childTileIds)
    showTiles(uniqueParentTileIdsToAdd)
  }

  checkSiblingsCanMerge = (tiles: Tile[], canvasCenter: Vector3) => {
    const _checkTilesAllExist = (tileIdsToCheck: TileId[]) => {
      const existMap = tileIdsToCheck.map(tileIdToCheck => {
        const isExist = this.tiles.some(tile => this.tileUtilsService.isTileIdEqual(tileIdToCheck, tile.id))
        return { tile: tileIdToCheck, isExist: isExist }
      })
      const isAllExist = existMap.every(isExist => isExist.isExist)
      return isAllExist
    }
    const siblingsOkToMerge = tiles.filter(tile => {
      const parentFromId = this.tileUtilsService.getIdFromChildTile(tile.id)
      if (parentFromId) {
        const siblingIds = this.tileUtilsService.calculateChildTileIdsFromId(parentFromId)
        const siblingsExist = _checkTilesAllExist(siblingIds)
        const siblingsAllFarToCanvasCenter = true
        return siblingsExist && siblingsAllFarToCanvasCenter
      } else {
        console.error("No parent tile");
        return false
      }
    })
    siblingsOkToMerge.forEach(tile => {
      if (tile.mesh) {
        const randomColor = Math.floor(Math.random() * 0xffff00)
        tile.mesh.material.color = new Color(randomColor)
      }
    })
    return siblingsOkToMerge
  }



}
