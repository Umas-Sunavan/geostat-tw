export interface Gui3dSettings {
    column: GuiColumnSettings
    ground: GuiGroundSettings
    outline: GuiOutlineSettings
}

export interface GuiColumnSettings {
  color: string,
  opactiy: number,
  height: number,
  scale: number
}
export interface GuiGroundSettings {
  color: string,
  opacity: number,
}
export interface GuiOutlineSettings {
  color: string,
  opacity: number,
}