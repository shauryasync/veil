export type DetectionType =
  | "EMAIL"
  | "PHONE_NUMBER"
  | "PAN"
  | "AADHAAR"
  | "API_KEY"
  | "JWT"
  | "AWS_ACCESS_KEY"
  | "PRIVATE_KEY"
  | "HIGH_ENTROPY_TOKEN"
  | "CONNECTION_STRING"
  | "ENV_VAR"
  | "LITERAL";

export type Detection = {
  type: DetectionType;
  start: number;
  end: number;
  value: string;
  confidence: number;
};

export interface Detector {
  name: string;
  detect(text: string): Detection[];
}

export type RedactResult = {
  redactedText: string;
  detections: Detection[];
  mapping: Record<string, string>;
};
