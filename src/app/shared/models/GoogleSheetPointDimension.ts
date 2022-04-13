export interface GoogleSheetPointDimension {
  [key: string]: {
    deleted: Boolean,
    options: {
      cameraPosition: {
        x: number,
        y: number,
        z: number,
      },
      colors: {
        mainColor: string
      },
      columnHeight: number,
      connectMode: string,
      connectedPoints: number[],
      focusOnPoint: {
        x: number,
        y: number,
        z: number,
      },
      radius: number
    },
    tableCreateDate: string,
    tableCreator: string,
    tableName: string,
    tableSource: string,
  }
}