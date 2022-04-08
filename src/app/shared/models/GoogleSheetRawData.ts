export interface GoogleSheetRawData {
    version: string,
    reqId: string,
    status: string,
    sig: string,
    table: {
      cols: {
        id: string;
        label: string;
        type: string;
      }[];
      rows: PointDataRowInSheet[];
      parsedNumHeaders: number;
    }
}

export interface PointDataRowInSheet {
  c: {
    v: string;
  }[];
}