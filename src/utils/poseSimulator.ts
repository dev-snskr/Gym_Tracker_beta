import { ExerciseType, Landmark } from '../types/fitness';
import { POSE_LANDMARKS } from './biomechanics';

/**
 * Generates synthetic 33-landmark MediaPipe pose data
 * Simulates lifter biomechanics in real-time with configurable form flaws.
 */
export class PoseSimulator {
  private startTime: number = Date.now();
  private exercise: ExerciseType = 'squat';
  public injectFlaw: boolean = false;

  constructor(exercise: ExerciseType = 'squat') {
    this.exercise = exercise;
  }

  setExercise(exercise: ExerciseType) {
    this.exercise = exercise;
    this.startTime = Date.now();
  }

  getCurrentFrame(): Landmark[] {
    const elapsedSec = (Date.now() - this.startTime) / 1000;
    // 3.5 second repetition cycle
    const cycle = (elapsedSec % 3.5) / 3.5;
    // Sinusoidal oscillation from 0 (standing/start) to 1 (bottom inflection)
    const t = 0.5 - 0.5 * Math.cos(cycle * 2 * Math.PI);

    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));

    if (this.exercise === 'squat') {
      // Lifter facing camera or 3/4 angle
      const headY = 0.18 + t * 0.18;
      const shoulderY = 0.3 + t * 0.22;
      const hipY = 0.52 + t * 0.24;
      const kneeY = 0.72 + t * 0.08;
      const ankleY = 0.92;

      // Torso lean flaw if enabled
      const torsoLeanOffset = this.injectFlaw ? 0.09 * t : 0.02 * t;

      // Nose / Face
      landmarks[POSE_LANDMARKS.NOSE] = { x: 0.5 + torsoLeanOffset, y: headY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.LEFT_EYE] = { x: 0.48 + torsoLeanOffset, y: headY - 0.02, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_EYE] = { x: 0.52 + torsoLeanOffset, y: headY - 0.02, visibility: 0.98 };

      // Shoulders
      landmarks[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.42 + torsoLeanOffset, y: shoulderY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.58 + torsoLeanOffset, y: shoulderY, visibility: 0.98 };

      // Arms (holding hands in front or crossed)
      landmarks[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.38 + torsoLeanOffset, y: shoulderY + 0.12, visibility: 0.95 };
      landmarks[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.62 + torsoLeanOffset, y: shoulderY + 0.12, visibility: 0.95 };
      landmarks[POSE_LANDMARKS.LEFT_WRIST] = { x: 0.46, y: shoulderY + 0.16, visibility: 0.95 };
      landmarks[POSE_LANDMARKS.RIGHT_WRIST] = { x: 0.54, y: shoulderY + 0.16, visibility: 0.95 };

      // Hips
      landmarks[POSE_LANDMARKS.LEFT_HIP] = { x: 0.44, y: hipY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.56, y: hipY, visibility: 0.98 };

      // Knees (Valgus flaw: knees cave inward)
      const kneeSpread = this.injectFlaw && t > 0.4 ? 0.03 : 0.09 + t * 0.02;
      landmarks[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.5 - kneeSpread, y: kneeY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.5 + kneeSpread, y: kneeY, visibility: 0.98 };

      // Ankles & Feet
      landmarks[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.38, y: ankleY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.62, y: ankleY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.LEFT_FOOT_INDEX] = { x: 0.36, y: ankleY + 0.03, visibility: 0.95 };
      landmarks[POSE_LANDMARKS.RIGHT_FOOT_INDEX] = { x: 0.64, y: ankleY + 0.03, visibility: 0.95 };
    } else if (this.exercise === 'pushup') {
      // Horizontal profile lifter
      const bodyAngleRad = 0.15;
      const headX = 0.25;
      const shoulderX = 0.32;
      const hipX = 0.58;
      const ankleX = 0.82;

      // Depth lowering: shoulders drop towards ground (0.75 floor)
      const floorY = 0.76;
      const startShoulderY = 0.48;
      const deepShoulderY = 0.68;
      const shoulderY = startShoulderY + t * (deepShoulderY - startShoulderY);

      // Sagging hips flaw: hips drop excessively
      const hipSag = this.injectFlaw ? 0.12 * t : 0;
      const hipY = shoulderY + (floorY - shoulderY) * 0.45 + hipSag;

      landmarks[POSE_LANDMARKS.NOSE] = { x: headX, y: shoulderY - 0.05, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.LEFT_SHOULDER] = { x: shoulderX, y: shoulderY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: shoulderX + 0.04, y: shoulderY - 0.02, visibility: 0.9 };

      // Elbows bend
      const elbowX = shoulderX + 0.08 - t * 0.05;
      const elbowY = shoulderY + 0.1 - t * 0.08;
      landmarks[POSE_LANDMARKS.LEFT_ELBOW] = { x: elbowX, y: elbowY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_ELBOW] = { x: elbowX + 0.02, y: elbowY - 0.02, visibility: 0.9 };

      // Wrists planted on ground
      landmarks[POSE_LANDMARKS.LEFT_WRIST] = { x: shoulderX, y: floorY - 0.02, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_WRIST] = { x: shoulderX + 0.04, y: floorY - 0.04, visibility: 0.9 };

      landmarks[POSE_LANDMARKS.LEFT_HIP] = { x: hipX, y: hipY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_HIP] = { x: hipX + 0.03, y: hipY - 0.02, visibility: 0.9 };

      const kneeX = (hipX + ankleX) / 2;
      const kneeY = (hipY + floorY) / 2;
      landmarks[POSE_LANDMARKS.LEFT_KNEE] = { x: kneeX, y: kneeY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_KNEE] = { x: kneeX + 0.02, y: kneeY - 0.02, visibility: 0.9 };

      landmarks[POSE_LANDMARKS.LEFT_ANKLE] = { x: ankleX, y: floorY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_ANKLE] = { x: ankleX + 0.02, y: floorY - 0.02, visibility: 0.9 };
      landmarks[POSE_LANDMARKS.LEFT_FOOT_INDEX] = { x: ankleX + 0.04, y: floorY, visibility: 0.95 };
      landmarks[POSE_LANDMARKS.RIGHT_FOOT_INDEX] = { x: ankleX + 0.06, y: floorY, visibility: 0.9 };
    } else if (this.exercise === 'bicep_curl') {
      // Standing front/side view
      landmarks[POSE_LANDMARKS.NOSE] = { x: 0.5, y: 0.2, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.42, y: 0.32, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.58, y: 0.32, visibility: 0.98 };

      // Elbow pinning / drift flaw
      const elbowDrift = this.injectFlaw ? 0.07 * t : 0.01 * t;

      landmarks[POSE_LANDMARKS.LEFT_ELBOW] = { x: 0.4 + elbowDrift, y: 0.52, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_ELBOW] = { x: 0.6 - elbowDrift, y: 0.52, visibility: 0.98 };

      // Wrists curl up from 0.72 (bottom) to 0.38 (peak contraction)
      const wristY = 0.72 - t * 0.34;
      const wristXLeft = 0.41 + t * 0.03;
      const wristXRight = 0.59 - t * 0.03;

      landmarks[POSE_LANDMARKS.LEFT_WRIST] = { x: wristXLeft, y: wristY, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_WRIST] = { x: wristXRight, y: wristY, visibility: 0.98 };

      landmarks[POSE_LANDMARKS.LEFT_HIP] = { x: 0.44, y: 0.58, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.56, y: 0.58, visibility: 0.98 };

      landmarks[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.43, y: 0.76, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.57, y: 0.76, visibility: 0.98 };

      landmarks[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.42, y: 0.94, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.58, y: 0.94, visibility: 0.98 };
    } else {
      // Lunges
      const torsoTilt = this.injectFlaw ? 0.07 * t : 0.01;
      const lungeDrop = t * 0.2;

      landmarks[POSE_LANDMARKS.NOSE] = { x: 0.48 + torsoTilt, y: 0.22 + lungeDrop, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.LEFT_SHOULDER] = { x: 0.44 + torsoTilt, y: 0.34 + lungeDrop, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_SHOULDER] = { x: 0.54 + torsoTilt, y: 0.34 + lungeDrop, visibility: 0.98 };

      landmarks[POSE_LANDMARKS.LEFT_HIP] = { x: 0.45, y: 0.54 + lungeDrop, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_HIP] = { x: 0.53, y: 0.54 + lungeDrop, visibility: 0.98 };

      // Front leg
      landmarks[POSE_LANDMARKS.LEFT_KNEE] = { x: 0.38, y: 0.72 + lungeDrop * 0.3, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.LEFT_ANKLE] = { x: 0.36, y: 0.92, visibility: 0.98 };

      // Back leg dropping down
      landmarks[POSE_LANDMARKS.RIGHT_KNEE] = { x: 0.62, y: 0.7 + lungeDrop * 0.95, visibility: 0.98 };
      landmarks[POSE_LANDMARKS.RIGHT_ANKLE] = { x: 0.72, y: 0.88 + lungeDrop * 0.2, visibility: 0.98 };
    }

    return landmarks;
  }
}
