export type ExerciseType = 'squat' | 'pushup' | 'bicep_curl' | 'lunge';

export type GoalType = 'strength' | 'hypertrophy' | 'form_mastery';

export type RepPhase = 'IDLE' | 'START' | 'ECCENTRIC' | 'INFLECTION' | 'CONCENTRIC' | 'COMPLETED';

export type DisplayMode = 'side_by_side' | 'pip' | 'overlay';

export type CameraFacingMode = 'user' | 'environment'; // 'user' = Front/Selfie, 'environment' = Rear camera

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface AngleReading {
  name: string;
  angle: number;
  targetRange: [number, number];
  isOptimal: boolean;
  jointA: number;
  jointB: number;
  jointC: number;
}

export interface BiomechanicalDeviation {
  id: string;
  message: string;
  severity: 'warning' | 'critical';
  jointAffected: string;
  recommendedCorrection: string;
}

export interface RepetitionRecord {
  repNumber: number;
  phase: RepPhase;
  durationMs: number;
  minAngle: number;
  maxAngle: number;
  formScore: number; // 0 - 100
  isValid: boolean;
  deviations: string[];
  inflectionDepthMet: boolean;
  timestamp: number;
}

export interface WorkoutSessionSummary {
  id: string;
  exercise: ExerciseType;
  goal: GoalType;
  targetReps: number;
  totalValidReps: number;
  totalIncompleteReps: number;
  averageFormScore: number;
  durationSeconds: number;
  fatigueIndex: number; // calculated form degradation %
  repetitions: RepetitionRecord[];
  commonMistakes: { mistake: string; count: number }[];
  createdAt: string;
}

export interface CalibrationStatus {
  headVisible: boolean;
  torsoVisible: boolean;
  hipsVisible: boolean;
  kneesVisible: boolean;
  anklesVisible: boolean;
  distanceAdequate: boolean;
  confidenceScore: number;
}

export interface NutritionProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
  fitnessGoal: 'fat_loss' | 'maintenance' | 'muscle_gain';
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatsGrams: number;
  waterLiters: number;
}

export interface MealSuggestion {
  name: string;
  timeOfDay: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  foods: string[];
  beginnerTip: string;
}
