import { aadhaarDetector } from "./detectors/aadhaar.js";
import { awsAccessKeyDetector } from "./detectors/aws-access-key.js";
import { connectionStringDetector } from "./detectors/connection-string.js";
import { emailDetector } from "./detectors/email.js";
import { envVarDetector } from "./detectors/env-var.js";
import { highEntropyTokenDetector } from "./detectors/high-entropy-token.js";
import { jwtDetector } from "./detectors/jwt.js";
import { panDetector } from "./detectors/pan.js";
import { phoneDetector } from "./detectors/phone.js";
import { privateKeyDetector } from "./detectors/private-key.js";
import type { Detector } from "./types.js";

export const defaultDetectors: readonly Detector[] = [
  emailDetector,
  phoneDetector,
  panDetector,
  aadhaarDetector,
  jwtDetector,
  awsAccessKeyDetector,
  privateKeyDetector,
  connectionStringDetector,
  envVarDetector,
  highEntropyTokenDetector,
];
