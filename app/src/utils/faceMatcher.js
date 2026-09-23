import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let landmarkerInstance = null;
let landmarkerLoadingPromise = null;

/**
 * Initializes and returns the singleton MediaPipe FaceLandmarker instance.
 */
export async function getFaceLandmarker() {
  if (landmarkerInstance) {
    return landmarkerInstance;
  }
  if (landmarkerLoadingPromise) {
    return await landmarkerLoadingPromise;
  }

  landmarkerLoadingPromise = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
        },
        runningMode: "IMAGE",
        numFaces: 2,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      landmarkerInstance = landmarker;
      return landmarker;
    } catch (err) {
      console.error("Failed to initialize FaceLandmarker:", err);
      landmarkerLoadingPromise = null;
      throw err;
    }
  })();

  return await landmarkerLoadingPromise;
}

/**
 * Helper to load an image source (data URL, URL, or image element) into an HTMLImageElement.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (src instanceof HTMLImageElement && src.complete) {
      return resolve(src);
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error("Failed to load baseline image for face analysis: " + e));
    img.src = typeof src === "string" ? src : src.src;
  });
}

/**
 * Extracts 3D facial landmarks from an image or data URL.
 */
export async function extractLandmarksFromImage(imageSrc) {
  try {
    const landmarker = await getFaceLandmarker();
    let imgElement;
    if (imageSrc instanceof HTMLCanvasElement || imageSrc instanceof HTMLVideoElement) {
      imgElement = imageSrc;
    } else {
      imgElement = await loadImage(imageSrc);
    }

    const results = landmarker.detect(imgElement);
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return { success: false, error: "No face detected in photo", count: 0, landmarks: null };
    }

    if (results.faceLandmarks.length > 1) {
      return { success: false, error: "Multiple faces detected. Please provide a single face photo.", count: results.faceLandmarks.length, landmarks: null };
    }

    return {
      success: true,
      landmarks: results.faceLandmarks[0],
      count: 1
    };
  } catch (err) {
    console.error("extractLandmarksFromImage error:", err);
    return { success: false, error: err.message, count: 0, landmarks: null };
  }
}

/**
 * Extracts landmarks from a live video feed by capturing a video snapshot frame.
 */
export async function extractLandmarksFromVideo(videoElement) {
  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return { success: false, error: "Video feed not active", count: 0, landmarks: null };
  }

  try {
    const landmarker = await getFaceLandmarker();
    
    // Draw current video frame to a temporary offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const results = landmarker.detect(canvas);
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return { success: false, error: "No face in front of camera", count: 0, landmarks: null };
    }

    if (results.faceLandmarks.length > 1) {
      return { success: false, error: "Multiple people detected in camera frame", count: results.faceLandmarks.length, landmarks: null };
    }

    return {
      success: true,
      landmarks: results.faceLandmarks[0],
      count: 1
    };
  } catch (err) {
    console.error("extractLandmarksFromVideo error:", err);
    return { success: false, error: err.message, count: 0, landmarks: null };
  }
}

/**
 * Distance between two 2D/3D points
 */
function euclideanDist(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = (p1.z || 0) - (p2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Calculates facial geometry ratios and normalized landmark vector
 */
function computeBiometricProfile(landmarks) {
  if (!landmarks || landmarks.length < 468) return null;

  // Key landmark indices
  // Left eye center: avg(33, 133, 159, 145)
  const leftEye = {
    x: (landmarks[33].x + landmarks[133].x + landmarks[159].x + landmarks[145].x) / 4,
    y: (landmarks[33].y + landmarks[133].y + landmarks[159].y + landmarks[145].y) / 4,
    z: (landmarks[33].z + landmarks[133].z + landmarks[159].z + landmarks[145].z) / 4,
  };

  // Right eye center: avg(362, 263, 386, 374)
  const rightEye = {
    x: (landmarks[362].x + landmarks[263].x + landmarks[386].x + landmarks[374].x) / 4,
    y: (landmarks[362].y + landmarks[263].y + landmarks[386].y + landmarks[374].y) / 4,
    z: (landmarks[362].z + landmarks[263].z + landmarks[386].z + landmarks[374].z) / 4,
  };

  // Inter-Ocular Distance (IOD)
  const iod = Math.max(euclideanDist(leftEye, rightEye), 0.001);

  // Mid-point between eyes (Center of Face Coordinate System)
  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
    z: (leftEye.z + rightEye.z) / 2,
  };

  const forehead = landmarks[10];
  const chin = landmarks[152];
  const noseTip = landmarks[1];
  const subnasale = landmarks[2];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const leftJaw = landmarks[172];
  const rightJaw = landmarks[397];

  // Geometric Ratios (Invariant to scale, distance and minor pose changes)
  const ratios = [
    euclideanDist(forehead, chin) / iod,       // 1. Total Face Height / IOD
    euclideanDist(noseTip, chin) / iod,        // 2. Lower Face Height / IOD
    euclideanDist(forehead, noseTip) / iod,     // 3. Upper Face Height / IOD
    euclideanDist(leftMouth, rightMouth) / iod, // 4. Mouth Width / IOD
    euclideanDist(leftCheek, rightCheek) / iod, // 5. Cheekbone Width / IOD
    euclideanDist(leftJaw, rightJaw) / iod,     // 6. Jaw Width / IOD
    euclideanDist(subnasale, chin) / iod,       // 7. Chin Height / IOD
    euclideanDist(eyeCenter, noseTip) / iod,    // 8. Nose Drop / IOD
    euclideanDist(eyeCenter, leftMouth) / iod,  // 9. Eye to Left Mouth / IOD
    euclideanDist(eyeCenter, rightMouth) / iod, // 10. Eye to Right Mouth / IOD
  ];

  // Normalized 3D landmark vector (centered at eyeCenter, scaled by IOD)
  // We take 80 distinct structural facial anchor points to capture unique face shape
  const anchorIndices = [
    10, 152, 1, 2, 61, 291, 234, 454, 172, 397,
    33, 133, 159, 145, 362, 263, 386, 374,
    70, 63, 105, 66, 107, 336, 296, 334, 293, 300,
    168, 6, 197, 195, 5, 4, 19, 94, 2, 164, 0, 17, 18, 200, 199, 175,
    58, 136, 149, 176, 148, 377, 400, 378, 397, 288, 365, 379, 364
  ];

  const normVector = [];
  anchorIndices.forEach((idx) => {
    const pt = landmarks[idx] || landmarks[0];
    normVector.push((pt.x - eyeCenter.x) / iod);
    normVector.push((pt.y - eyeCenter.y) / iod);
    normVector.push(((pt.z || 0) - eyeCenter.z) / iod);
  });

  return { ratios, normVector, iod };
}

/**
 * Computes Cosine Similarity between two arrays of numbers
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Compares two sets of MediaPipe face landmarks.
 * Returns match confidence (0 - 100%), boolean isMatch, and diagnostic details.
 */
export function compareFaceLandmarks(baselineLandmarks, liveLandmarks, threshold = 72) {
  if (!baselineLandmarks || !liveLandmarks) {
    return {
      isMatch: false,
      confidence: 0,
      geometricSimilarity: 0,
      vectorSimilarity: 0,
      reason: "Missing facial landmarks for comparison",
    };
  }

  const profileBase = computeBiometricProfile(baselineLandmarks);
  const profileLive = computeBiometricProfile(liveLandmarks);

  if (!profileBase || !profileLive) {
    return {
      isMatch: false,
      confidence: 0,
      geometricSimilarity: 0,
      vectorSimilarity: 0,
      reason: "Unable to extract biometric profile",
    };
  }

  // 1. Geometric ratio similarity
  let ratioDiffSum = 0;
  for (let i = 0; i < profileBase.ratios.length; i++) {
    const baseR = profileBase.ratios[i];
    const liveR = profileLive.ratios[i];
    const diffPercent = Math.abs(liveR - baseR) / Math.max(baseR, 0.001);
    ratioDiffSum += Math.min(diffPercent, 1.0);
  }
  const meanRatioDiff = ratioDiffSum / profileBase.ratios.length;
  const geometricSimilarity = Math.max(0, 1 - meanRatioDiff); // 0 to 1

  // 2. Normalized vector cosine similarity
  const rawCosine = cosineSimilarity(profileBase.normVector, profileLive.normVector);
  const vectorSimilarity = Math.max(0, rawCosine); // 0 to 1

  // 3. Combined confidence score
  // Weight: 45% geometric ratios, 55% shape anchor vectors
  const combinedScore = (0.45 * geometricSimilarity + 0.55 * vectorSimilarity) * 100;
  const confidence = Math.min(100, Math.max(0, Math.round(combinedScore)));

  const isMatch = confidence >= threshold;

  return {
    isMatch,
    confidence,
    geometricSimilarity: Math.round(geometricSimilarity * 100),
    vectorSimilarity: Math.round(vectorSimilarity * 100),
    threshold,
    reason: isMatch
      ? "Biometric identity verified successfully"
      : confidence < 50
      ? "Face does not match registered baseline photo"
      : "Low biometric match confidence. Please face camera directly with good lighting."
  };
}
