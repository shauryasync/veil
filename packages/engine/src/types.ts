export type Detection = {
  type: string;
  start: number;
  end: number;
  value: string;
  confidence: number;
};

export interface Detector {
  name: string;
  detect(text: string): Detection[];
}
