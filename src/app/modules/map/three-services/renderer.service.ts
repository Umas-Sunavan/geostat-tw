import { ElementRef, Injectable } from '@angular/core';
import { Vector2, WebGLRenderer } from 'three';

@Injectable({
  providedIn: 'root'
})
export class RendererService {

  constructor() { }

  renderer = new WebGLRenderer({ precision: 'lowp' })

  makeRenderer = (domToAppend: ElementRef<HTMLCanvasElement>, w: number = 600, h: number = 450) => {
    this.renderer.setSize(w, h)
    domToAppend.nativeElement.appendChild(this.renderer.domElement)
    return this.renderer
  }

  updateMouse = (event: MouseEvent) => {
    const domLeftPadding = this.renderer.domElement.offsetLeft
    const domTopPadding = this.renderer.domElement.offsetTop
    const mouseX = event.clientX
    const mouseY = event.clientY
    const canvasWidth = this.renderer.domElement.width
    const canvasHeight = this.renderer.domElement.height
    const mouseXInCanvas = mouseX - domLeftPadding
    const mouseYInCanvas = mouseY - domTopPadding
    const mouseOnCanvas = new Vector2(
      (mouseXInCanvas / canvasWidth) * 2 - 1,
       - (mouseYInCanvas / canvasHeight) * 2 + 1)
    
    return mouseOnCanvas
  }
}
