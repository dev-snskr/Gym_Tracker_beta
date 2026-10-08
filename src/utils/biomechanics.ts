import {
  ExerciseType,
  Landmark,
  RepPhase,
  BiomechanicalDeviation,
  RepetitionRecord,
} from '../types/fitness';

export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

// SKELETON CONNECTIONS FOR CANVAS DRAWING
export const POSE_CONNECTIONS: [number, number][] = [
  // Face
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_EYE],
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.LEFT_EAR],
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EAR],
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  // Left arm
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  // Right arm
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  // Left leg
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  // Right leg
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
];

/**
 * Computes 2D angle between three landmarks: A(x, y), B(x, y), C(x, y) where B is the vertex.
 */
export function calculate2DAngle(a: Landmark, b: Landmark, c: Landmark): number {
  if (!a || !b || !c) return 0;
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return Math.round(angle);
}

/**
 * Calculates Euclidean distance between 2 landmarks
 */
export function calculateDistance(a: Landmark, b: Landmark): number {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Determines which side (left or right) has higher overall visibility
 */
export function getDominantSide(landmarks: Landmark[]): 'left' | 'right' {
  if (!landmarks || landmarks.length < 33) return 'left';
  const leftVis =
    ((landmarks[POSE_LANDMARKS.LEFT_SHOULDER]?.visibility ?? 1) +
      (landmarks[POSE_LANDMARKS.LEFT_HIP]?.visibility ?? 1) +
      (landmarks[POSE_LANDMARKS.LEFT_KNEE]?.visibility ?? 1) +
      (landmarks[POSE_LANDMARKS.LEFT_ANKLE]?.visibility ?? 1)) / 4;

  const rightVis =
    ((landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]?.visibility ?? 1) +
      (landmarks[POSE_LANDMARKS.RIGHT_HIP]?.visibility ?? 1) +
      (landmarks[POSE_LANDMARKS.RIGHT_KNEE]?.visibility ?? 1) +
      (landmarks[POSE_LANDMARKS.RIGHT_ANKLE]?.visibility ?? 1)) / 4;

  return rightVis > leftVis ? 'right' : 'left';
}

export interface BiomechanicalAnalysisResult {
  primaryAngle: number;
  secondaryAngle: number;
  primaryJointName: string;
  secondaryJointName: string;
  isPrimaryOptimal: boolean;
  isSecondaryOptimal: boolean;
  deviations: BiomechanicalDeviation[];
  formScore: number; // 0 - 100
  keyPoints: {
    vertexA: Landmark;
    vertexB: Landmark; // main vertex
    vertexC: Landmark;
  };
  dominantSide: 'left' | 'right';
}

export function evaluateExerciseForm(
  exercise: ExerciseType,
  landmarks: Landmark[]
): BiomechanicalAnalysisResult {
  const side = getDominantSide(landmarks);
  const isLeft = side === 'left';

  const shoulder = landmarks[isLeft ? POSE_LANDMARKS.LEFT_SHOULDER : POSE_LANDMARKS.RIGHT_SHOULDER];
  const elbow = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ELBOW : POSE_LANDMARKS.RIGHT_ELBOW];
  const wrist = landmarks[isLeft ? POSE_LANDMARKS.LEFT_WRIST : POSE_LANDMARKS.RIGHT_WRIST];
  const hip = landmarks[isLeft ? POSE_LANDMARKS.LEFT_HIP : POSE_LANDMARKS.RIGHT_HIP];
  const knee = landmarks[isLeft ? POSE_LANDMARKS.LEFT_KNEE : POSE_LANDMARKS.RIGHT_KNEE];
  const ankle = landmarks[isLeft ? POSE_LANDMARKS.LEFT_ANKLE : POSE_LANDMARKS.RIGHT_ANKLE];

  const leftKnee = landmarks[POSE_LANDMARKS.LEFT_KNEE];
  const rightKnee = landmarks[POSE_LANDMARKS.RIGHT_KNEE];
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE];
  const rightAnkle = landmarks[POSE_LANDMARKS.RIGHT_ANKLE];

  const deviations: BiomechanicalDeviation[] = [];
  let formScore = 100;

  if (exercise === 'squat') {
    // 1. Primary: Hip-Knee-Ankle
    const kneeAngle = calculate2DAngle(hip, knee, ankle);
    // 2. Secondary: Torso angle (Shoulder-Hip relative to vertical)
    // Virtual vertical point straight up above hip
    const virtualVertical: Landmark = { x: hip.x, y: hip.y - 0.5 };
    const torsoTiltAngle = calculate2DAngle(shoulder, hip, virtualVertical);

    // Knee angle evaluation
    const isKneeOptimal = kneeAngle >= 75 && kneeAngle <= 175;

    // Biomechanical rules check
    if (torsoTiltAngle > 45) {
      deviations.push({
        id: 'excessive_torso_lean',
        message: 'Excessive forward torso lean',
        severity: 'critical',
        jointAffected: 'Spine / Hip',
        recommendedCorrection: 'Brace your core and keep your chest lifted high.',
      });
      formScore -= 30;
    }

    // Knee valgus (caving inward) check when both knees/ankles are visible
    if (leftKnee && rightKnee && leftAnkle && rightAnkle) {
      const kneeDistance = Math.abs(leftKnee.x - rightKnee.x);
      const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);
      // If knees are significantly narrower than ankles during descent
      if (kneeAngle < 140 && kneeDistance < ankleDistance * 0.72) {
        deviations.push({
          id: 'knee_valgus',
          message: 'Knees caving inward',
          severity: 'critical',
          jointAffected: 'Knee Joint',
          recommendedCorrection: 'Push knees outward in line with your middle toes.',
        });
        formScore -= 25;
      }
    }

    return {
      primaryAngle: kneeAngle,
      secondaryAngle: torsoTiltAngle,
      primaryJointName: 'Knee Flexion (Hip-Knee-Ankle)',
      secondaryJointName: 'Torso Tilt (Shoulder-Hip)',
      isPrimaryOptimal: isKneeOptimal,
      isSecondaryOptimal: torsoTiltAngle <= 45,
      deviations,
      formScore: Math.max(0, formScore),
      keyPoints: { vertexA: hip, vertexB: knee, vertexC: ankle },
      dominantSide: side,
    };
  }

  if (exercise === 'pushup') {
    // 1. Primary: Shoulder-Elbow-Wrist (Elbow Flexion)
    const elbowAngle = calculate2DAngle(shoulder, elbow, wrist);
    // 2. Secondary: Spine Alignment (Shoulder-Hip-Ankle)
    const spineAngle = calculate2DAngle(shoulder, hip, ankle);

    // Pushup rules
    // Spine alignment: deviation > 15° from 180°
    const spineDeviation = Math.abs(180 - spineAngle);
    if (spineDeviation > 15) {
      if (spineAngle < 165) {
        // Hips sagging
        deviations.push({
          id: 'hips_sagging',
          message: 'Hips sagging / lower back arched',
          severity: 'critical',
          jointAffected: 'Core / Lumbar Spine',
          recommendedCorrection: 'Squeeze glutes and pull navel to spine to maintain plank.',
        });
        formScore -= 35;
      } else {
        // Hips piked
        deviations.push({
          id: 'hips_piked',
          message: 'Hips piked too high',
          severity: 'warning',
          jointAffected: 'Pelvis',
          recommendedCorrection: 'Lower your hips to form a straight line from heels to head.',
        });
        formScore -= 20;
      }
    }

    // Elbow flaring check (angle of shoulder-elbow vs body vertical/horizontal)
    if (elbowAngle < 110 && Math.abs(elbow.y - shoulder.y) < 0.05 && Math.abs(elbow.x - shoulder.x) > 0.22) {
      deviations.push({
        id: 'elbow_flare',
        message: 'Elbows flaring too wide (>75°)',
        severity: 'warning',
        jointAffected: 'Glenohumeral / Elbow',
        recommendedCorrection: 'Tuck elbows closer to body (approx 45° arrow shape).',
      });
      formScore -= 20;
    }

    return {
      primaryAngle: elbowAngle,
      secondaryAngle: spineAngle,
      primaryJointName: 'Elbow Angle (Shoulder-Elbow-Wrist)',
      secondaryJointName: 'Spine Alignment (Shoulder-Hip-Ankle)',
      isPrimaryOptimal: elbowAngle >= 70 && elbowAngle <= 180,
      isSecondaryOptimal: spineDeviation <= 15,
      deviations,
      formScore: Math.max(0, formScore),
      keyPoints: { vertexA: shoulder, vertexB: elbow, vertexC: wrist },
      dominantSide: side,
    };
  }

  if (exercise === 'bicep_curl') {
    // 1. Primary: Shoulder-Elbow-Wrist
    const elbowAngle = calculate2DAngle(shoulder, elbow, wrist);
    // 2. Secondary: Elbow Drift (horizontal offset between elbow and shoulder)
    const elbowDrift = Math.abs(elbow.x - shoulder.x);
    const virtualVertical: Landmark = { x: shoulder.x, y: shoulder.y + 0.5 };
    const upperArmAngle = calculate2DAngle(elbow, shoulder, virtualVertical);

    // Rules:
    // Elbow pinning: if upper arm swings forward/backward > 25°
    if (upperArmAngle > 28) {
      deviations.push({
        id: 'elbow_drift',
        message: 'Elbows swinging / using momentum',
        severity: 'critical',
        jointAffected: 'Shoulder / Elbow Anchor',
        recommendedCorrection: 'Pin your elbows firmly against your ribs; isolate the biceps.',
      });
      formScore -= 35;
    }

    return {
      primaryAngle: elbowAngle,
      secondaryAngle: upperArmAngle,
      primaryJointName: 'Elbow Flexion (Shoulder-Elbow-Wrist)',
      secondaryJointName: 'Upper Arm Stability',
      isPrimaryOptimal: elbowAngle >= 40 && elbowAngle <= 175,
      isSecondaryOptimal: upperArmAngle <= 25,
      deviations,
      formScore: Math.max(0, formScore),
      keyPoints: { vertexA: shoulder, vertexB: elbow, vertexC: wrist },
      dominantSide: side,
    };
  }

  // Lunges
  // Primary: Front knee angle; Secondary: Torso tilt
  const kneeAngle = calculate2DAngle(hip, knee, ankle);
  const virtualVertical: Landmark = { x: hip.x, y: hip.y - 0.5 };
  const torsoTilt = calculate2DAngle(shoulder, hip, virtualVertical);

  if (torsoTilt > 35) {
    deviations.push({
      id: 'torso_lean_lunge',
      message: 'Torso collapsing forward',
      severity: 'warning',
      jointAffected: 'Thoracic / Core',
      recommendedCorrection: 'Keep shoulders stacked directly over hips.',
    });
    formScore -= 25;
  }

  // Front knee shooting past toes (check if knee X extends past ankle X significantly)
  if (Math.abs(knee.x - ankle.x) > 0.18) {
    deviations.push({
      id: 'knee_over_toes',
      message: 'Front knee pushing too far forward',
      severity: 'warning',
      jointAffected: 'Patellar Tendon',
      recommendedCorrection: 'Drop back knee straight down to achieve 90° angles.',
    });
    formScore -= 20;
  }

  return {
    primaryAngle: kneeAngle,
    secondaryAngle: torsoTilt,
    primaryJointName: 'Front Knee Angle',
    secondaryJointName: 'Torso Angle',
    isPrimaryOptimal: kneeAngle >= 80 && kneeAngle <= 175,
    isSecondaryOptimal: torsoTilt <= 30,
    deviations,
    formScore: Math.max(0, formScore),
    keyPoints: { vertexA: hip, vertexB: knee, vertexC: ankle },
    dominantSide: side,
  };
}

/**
 * Biomechanical State Machine for Repetition Tracking
 * Handles phase transitions:
 * IDLE -> START -> ECCENTRIC -> INFLECTION -> CONCENTRIC -> COMPLETED
 */
export class ExerciseStateMachine {
  exercise: ExerciseType;
  currentPhase: RepPhase = 'IDLE';
  repCount = 0;
  incompleteRepCount = 0;
  currentRepStartTime = 0;
  minAngleEncountered = 999;
  maxAngleEncountered = 0;
  formScoresDuringRep: number[] = [];
  deviationsDuringRep: Set<string> = new Set();
  inflectionDepthMet = false;

  constructor(exercise: ExerciseType) {
    this.exercise = exercise;
  }

  reset() {
    this.currentPhase = 'IDLE';
    this.repCount = 0;
    this.incompleteRepCount = 0;
    this.currentRepStartTime = 0;
    this.minAngleEncountered = 999;
    this.maxAngleEncountered = 0;
    this.formScoresDuringRep = [];
    this.deviationsDuringRep.clear();
    this.inflectionDepthMet = false;
  }

  setExercise(exercise: ExerciseType) {
    this.exercise = exercise;
    this.reset();
  }

  processFrame(
    analysis: BiomechanicalAnalysisResult,
    timestamp: number
  ): {
    phaseChanged: boolean;
    repCompleted: boolean;
    isIncompleteRep: boolean;
    currentPhase: RepPhase;
    repCount: number;
    incompleteRepCount: number;
    repRecord?: RepetitionRecord;
  } {
    const angle = analysis.primaryAngle;
    let phaseChanged = false;
    let repCompleted = false;
    let isIncompleteRep = false;
    let repRecord: RepetitionRecord | undefined = undefined;

    if (this.currentPhase !== 'IDLE') {
      this.minAngleEncountered = Math.min(this.minAngleEncountered, angle);
      this.maxAngleEncountered = Math.max(this.maxAngleEncountered, angle);
      this.formScoresDuringRep.push(analysis.formScore);
      analysis.deviations.forEach((d) => this.deviationsDuringRep.add(d.message));
    }

    if (this.exercise === 'squat') {
      // Squat:
      // Stand: ~165°-180°
      // Lowering: < 150°
      // Inflection Depth: <= 100° (parallel/deep)
      // Ascending: > 120°
      // Stand: > 165°
      switch (this.currentPhase) {
        case 'IDLE':
          if (angle >= 160) {
            this.currentPhase = 'START';
            phaseChanged = true;
          }
          break;

        case 'START':
          if (angle < 150) {
            this.currentPhase = 'ECCENTRIC';
            this.currentRepStartTime = timestamp;
            this.minAngleEncountered = angle;
            this.maxAngleEncountered = angle;
            this.formScoresDuringRep = [analysis.formScore];
            this.deviationsDuringRep.clear();
            this.inflectionDepthMet = false;
            phaseChanged = true;
          }
          break;

        case 'ECCENTRIC':
          if (angle <= 100) {
            this.currentPhase = 'INFLECTION';
            this.inflectionDepthMet = true;
            phaseChanged = true;
          } else if (angle > 155 && this.minAngleEncountered > 115) {
            // Turned around before reaching proper depth!
            this.currentPhase = 'START';
            this.incompleteRepCount++;
            isIncompleteRep = true;
            phaseChanged = true;
          }
          break;

        case 'INFLECTION':
          if (angle > 115) {
            this.currentPhase = 'CONCENTRIC';
            phaseChanged = true;
          }
          break;

        case 'CONCENTRIC':
          if (angle >= 160) {
            // Rep completed successfully!
            this.repCount++;
            repCompleted = true;
            this.currentPhase = 'START';
            phaseChanged = true;

            const avgForm =
              this.formScoresDuringRep.length > 0
                ? Math.round(
                    this.formScoresDuringRep.reduce((a, b) => a + b, 0) /
                      this.formScoresDuringRep.length
                  )
                : 90;

            repRecord = {
              repNumber: this.repCount,
              phase: 'COMPLETED',
              durationMs: Math.max(800, timestamp - this.currentRepStartTime),
              minAngle: this.minAngleEncountered,
              maxAngle: this.maxAngleEncountered,
              formScore: avgForm,
              isValid: true,
              deviations: Array.from(this.deviationsDuringRep),
              inflectionDepthMet: this.inflectionDepthMet,
              timestamp,
            };
          }
          break;
      }
    } else if (this.exercise === 'pushup') {
      // Pushup:
      // Plank: Elbow > 155°
      // Lowering: < 140°
      // Bottom inflection: <= 90°
      // Pressing up: > 110°
      // Completed: > 155°
      switch (this.currentPhase) {
        case 'IDLE':
          if (angle >= 155) {
            this.currentPhase = 'START';
            phaseChanged = true;
          }
          break;

        case 'START':
          if (angle < 140) {
            this.currentPhase = 'ECCENTRIC';
            this.currentRepStartTime = timestamp;
            this.minAngleEncountered = angle;
            this.maxAngleEncountered = angle;
            this.formScoresDuringRep = [analysis.formScore];
            this.deviationsDuringRep.clear();
            this.inflectionDepthMet = false;
            phaseChanged = true;
          }
          break;

        case 'ECCENTRIC':
          if (angle <= 90) {
            this.currentPhase = 'INFLECTION';
            this.inflectionDepthMet = true;
            phaseChanged = true;
          } else if (angle > 145 && this.minAngleEncountered > 110) {
            this.currentPhase = 'START';
            this.incompleteRepCount++;
            isIncompleteRep = true;
            phaseChanged = true;
          }
          break;

        case 'INFLECTION':
          if (angle > 110) {
            this.currentPhase = 'CONCENTRIC';
            phaseChanged = true;
          }
          break;

        case 'CONCENTRIC':
          if (angle >= 155) {
            this.repCount++;
            repCompleted = true;
            this.currentPhase = 'START';
            phaseChanged = true;

            const avgForm =
              this.formScoresDuringRep.length > 0
                ? Math.round(
                    this.formScoresDuringRep.reduce((a, b) => a + b, 0) /
                      this.formScoresDuringRep.length
                  )
                : 85;

            repRecord = {
              repNumber: this.repCount,
              phase: 'COMPLETED',
              durationMs: Math.max(700, timestamp - this.currentRepStartTime),
              minAngle: this.minAngleEncountered,
              maxAngle: this.maxAngleEncountered,
              formScore: avgForm,
              isValid: true,
              deviations: Array.from(this.deviationsDuringRep),
              inflectionDepthMet: this.inflectionDepthMet,
              timestamp,
            };
          }
          break;
      }
    } else if (this.exercise === 'bicep_curl') {
      // Bicep curl:
      // Extension: > 150°
      // Curling (Concentric): < 140°
      // Peak contraction (Inflection): <= 50°
      // Lowering (Eccentric): > 75°
      // Return: > 150°
      switch (this.currentPhase) {
        case 'IDLE':
          if (angle >= 150) {
            this.currentPhase = 'START';
            phaseChanged = true;
          }
          break;

        case 'START':
          if (angle < 140) {
            this.currentPhase = 'CONCENTRIC';
            this.currentRepStartTime = timestamp;
            this.minAngleEncountered = angle;
            this.maxAngleEncountered = angle;
            this.formScoresDuringRep = [analysis.formScore];
            this.deviationsDuringRep.clear();
            this.inflectionDepthMet = false;
            phaseChanged = true;
          }
          break;

        case 'CONCENTRIC':
          if (angle <= 50) {
            this.currentPhase = 'INFLECTION';
            this.inflectionDepthMet = true;
            phaseChanged = true;
          } else if (angle > 140 && this.minAngleEncountered > 85) {
            this.currentPhase = 'START';
            this.incompleteRepCount++;
            isIncompleteRep = true;
            phaseChanged = true;
          }
          break;

        case 'INFLECTION':
          if (angle > 70) {
            this.currentPhase = 'ECCENTRIC';
            phaseChanged = true;
          }
          break;

        case 'ECCENTRIC':
          if (angle >= 150) {
            this.repCount++;
            repCompleted = true;
            this.currentPhase = 'START';
            phaseChanged = true;

            const avgForm =
              this.formScoresDuringRep.length > 0
                ? Math.round(
                    this.formScoresDuringRep.reduce((a, b) => a + b, 0) /
                      this.formScoresDuringRep.length
                  )
                : 90;

            repRecord = {
              repNumber: this.repCount,
              phase: 'COMPLETED',
              durationMs: Math.max(700, timestamp - this.currentRepStartTime),
              minAngle: this.minAngleEncountered,
              maxAngle: this.maxAngleEncountered,
              formScore: avgForm,
              isValid: true,
              deviations: Array.from(this.deviationsDuringRep),
              inflectionDepthMet: this.inflectionDepthMet,
              timestamp,
            };
          }
          break;
      }
    } else {
      // Lunges
      switch (this.currentPhase) {
        case 'IDLE':
          if (angle >= 160) {
            this.currentPhase = 'START';
            phaseChanged = true;
          }
          break;

        case 'START':
          if (angle < 145) {
            this.currentPhase = 'ECCENTRIC';
            this.currentRepStartTime = timestamp;
            this.minAngleEncountered = angle;
            this.maxAngleEncountered = angle;
            this.formScoresDuringRep = [analysis.formScore];
            this.deviationsDuringRep.clear();
            this.inflectionDepthMet = false;
            phaseChanged = true;
          }
          break;

        case 'ECCENTRIC':
          if (angle <= 95) {
            this.currentPhase = 'INFLECTION';
            this.inflectionDepthMet = true;
            phaseChanged = true;
          } else if (angle > 150 && this.minAngleEncountered > 115) {
            this.currentPhase = 'START';
            this.incompleteRepCount++;
            isIncompleteRep = true;
            phaseChanged = true;
          }
          break;

        case 'INFLECTION':
          if (angle > 115) {
            this.currentPhase = 'CONCENTRIC';
            phaseChanged = true;
          }
          break;

        case 'CONCENTRIC':
          if (angle >= 160) {
            this.repCount++;
            repCompleted = true;
            this.currentPhase = 'START';
            phaseChanged = true;

            const avgForm =
              this.formScoresDuringRep.length > 0
                ? Math.round(
                    this.formScoresDuringRep.reduce((a, b) => a + b, 0) /
                      this.formScoresDuringRep.length
                  )
                : 88;

            repRecord = {
              repNumber: this.repCount,
              phase: 'COMPLETED',
              durationMs: Math.max(800, timestamp - this.currentRepStartTime),
              minAngle: this.minAngleEncountered,
              maxAngle: this.maxAngleEncountered,
              formScore: avgForm,
              isValid: true,
              deviations: Array.from(this.deviationsDuringRep),
              inflectionDepthMet: this.inflectionDepthMet,
              timestamp,
            };
          }
          break;
      }
    }

    return {
      phaseChanged,
      repCompleted,
      isIncompleteRep,
      currentPhase: this.currentPhase,
      repCount: this.repCount,
      incompleteRepCount: this.incompleteRepCount,
      repRecord,
    };
  }
}
