import React from 'react';
import { Camera, CheckCircle2, AlertCircle, Sparkles, Sliders, Play, Info, FlipHorizontal, RefreshCw } from 'lucide-react';
import { ExerciseType, GoalType, CalibrationStatus, CameraFacingMode } from '../types/fitness';

interface WorkoutSetupPanelProps {
  exercise: ExerciseType;
  setExercise: (ex: ExerciseType) => void;
  goal: GoalType;
  setGoal: (goal: GoalType) => void;
  targetReps: number;
  setTargetReps: (reps: number) => void;
  cameraDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  facingMode: CameraFacingMode;
  setFacingMode: (facing: CameraFacingMode) => void;
  isMirrored: boolean;
  setIsMirrored: (mirrored: boolean) => void;
  isSimulatedMode: boolean;
  setIsSimulatedMode: (sim: boolean) => void;
  injectFlaw: boolean;
  setInjectFlaw: (flaw: boolean) => void;
  calibration: CalibrationStatus;
  isStreaming: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

export const WorkoutSetupPanel: React.FC<WorkoutSetupPanelProps> = ({
  exercise,
  setExercise,
  goal,
  setGoal,
  targetReps,
  setTargetReps,
  cameraDevices,
  selectedDeviceId,
  setSelectedDeviceId,
  facingMode,
  setFacingMode,
  isMirrored,
  setIsMirrored,
  isSimulatedMode,
  setIsSimulatedMode,
  injectFlaw,
  setInjectFlaw,
  calibration,
  isStreaming,
  onStartTracking,
  onStopTracking,
}) => {
  const handleGoalChange = (newGoal: GoalType) => {
    setGoal(newGoal);
    if (newGoal === 'strength') setTargetReps(5);
    else if (newGoal === 'hypertrophy') setTargetReps(10);
    else if (newGoal === 'form_mastery') setTargetReps(6);
  };

  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    // Naturally unmirror rear camera, mirror front camera
    if (nextFacing === 'environment') {
      setIsMirrored(false);
    } else {
      setIsMirrored(true);
    }
  };

  const exerciseDescriptions: Record<
    ExerciseType,
    { title: string; targetAngle: string; cue: string; commonMistake: string }
  > = {
    squat: {
      title: 'Squats',
      targetAngle: 'Knees bend to <= 90°-100° (Parallel Depth)',
      cue: 'Sink hips back and down. Keep chest proud, push knees gently outwards.',
      commonMistake: 'Knees knocking inward or leaning chest too far forward.',
    },
    pushup: {
      title: 'Push-Ups',
      targetAngle: 'Elbows <= 90° depth, Straight Spine (180°)',
      cue: 'Hold tight plank lock. Lower chest to floor with elbows angled at 45° like an arrow.',
      commonMistake: 'Hips sagging toward floor or flaring elbows out to the sides.',
    },
    bicep_curl: {
      title: 'Bicep Curls',
      targetAngle: 'Full Stretch > 150°, Squeeze < 50°',
      cue: 'Pin elbows securely to ribs. Avoid swinging shoulders or torso for momentum.',
      commonMistake: 'Using lower back swing and letting elbows drift forward.',
    },
    lunge: {
      title: 'Lunges',
      targetAngle: 'Front Knee 90°, Back Knee 90° drop',
      cue: 'Step forward and drop back knee straight down. Torso stays tall and relaxed.',
      commonMistake: 'Front knee shooting past toes and shoulders collapsing onto thigh.',
    },
  };

  const currentInfo = exerciseDescriptions[exercise];

  return (
    <div className="bg-[#241716] border border-[#442E2D] rounded-3xl p-5 lg:p-6 space-y-6 shadow-xl transition-all">
      {/* Header with Camera controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#3D2928] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#542A31] text-[#FFD9DD] flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base text-[#F4DFDD] tracking-tight">
              Workout Setup & Calibration
            </h2>
            <p className="text-xs text-[#C6ABAA]">
              Dual synchronized view: Real camera footage side-by-side with biomechanical tracking
            </p>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2">
          {/* Rear / Front Camera Switcher Button */}
          {!isSimulatedMode && (
            <button
              onClick={toggleFacingMode}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                facingMode === 'environment'
                  ? 'bg-[#542A31] border-[#813C47] text-[#FFD9DD] font-bold'
                  : 'bg-[#2F1F1E] border-[#4E3534] text-[#D8BDBB] hover:text-white'
              }`}
              title="Switch between Rear camera (for tripod/partner) and Front selfie camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{facingMode === 'environment' ? 'Rear Camera (Active)' : 'Front Camera'}</span>
            </button>
          )}

          {/* Mirror toggle */}
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-1.5 rounded-full border transition-all cursor-pointer ${
              isMirrored
                ? 'bg-[#542A31] border-[#813C47] text-[#FFD9DD]'
                : 'bg-[#2F1F1E] border-[#4E3534] text-[#A78E8D] hover:text-[#E8BAB8]'
            }`}
            title={isMirrored ? 'Mirror image enabled' : 'Unmirrored (natural) view'}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Simulation Toggle */}
          <button
            onClick={() => setIsSimulatedMode(!isSimulatedMode)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
              isSimulatedMode
                ? 'bg-[#5D382B] border-[#8A513D] text-[#FFDBCF]'
                : 'bg-[#2F1F1E] border-[#4E3534] text-[#D8BDBB] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F7B4A2]" />
            <span>{isSimulatedMode ? 'Demo Simulator' : 'Live Camera'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Target Exercise Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#D8BDBB] block">
            Target Movement
          </label>
          <select
            value={exercise}
            onChange={(e) => setExercise(e.target.value as ExerciseType)}
            className="w-full bg-[#1A1010] border border-[#4C3332] rounded-2xl px-4 py-2.5 text-sm font-medium text-[#F4DFDD] focus:outline-none focus:border-[#F296A1] transition-all cursor-pointer"
          >
            <option value="squat">🏋️ Squats (HKA Depth & Valgus)</option>
            <option value="pushup">💪 Push-ups (Depth & Spine Plank)</option>
            <option value="bicep_curl">🔥 Bicep Curls (Elbow Pinning)</option>
            <option value="lunge">⚡ Lunges (90° Stride & Torso)</option>
          </select>
          <div className="text-xs text-[#C6ABAA] leading-relaxed bg-[#1A1010]/80 p-3 rounded-2xl border border-[#3E2A29]">
            <span className="text-[#F296A1] font-semibold">Standard: </span>
            {currentInfo.targetAngle}
          </div>
        </div>

        {/* 2. Goal & Rep Target */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#D8BDBB] block">
            Goal & Rep Volume
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#1A1010] border border-[#442E2D] rounded-full">
            <button
              onClick={() => handleGoalChange('strength')}
              className={`py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                goal === 'strength'
                  ? 'bg-[#F296A1] text-[#2C1316] font-bold shadow-sm'
                  : 'text-[#D0B7B5] hover:text-white'
              }`}
            >
              Strength
            </button>
            <button
              onClick={() => handleGoalChange('hypertrophy')}
              className={`py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                goal === 'hypertrophy'
                  ? 'bg-[#F296A1] text-[#2C1316] font-bold shadow-sm'
                  : 'text-[#D0B7B5] hover:text-white'
              }`}
            >
              Hypertrophy
            </button>
            <button
              onClick={() => handleGoalChange('form_mastery')}
              className={`py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                goal === 'form_mastery'
                  ? 'bg-[#F296A1] text-[#2C1316] font-bold shadow-sm'
                  : 'text-[#D0B7B5] hover:text-white'
              }`}
            >
              Mastery
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#C6ABAA]">Target Reps:</span>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="3"
                max="25"
                value={targetReps}
                onChange={(e) => setTargetReps(Number(e.target.value))}
                className="w-28 accent-[#F296A1] cursor-pointer"
              />
              <span className="font-mono text-sm font-bold text-[#F296A1] min-w-6 text-right">
                {targetReps}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Camera Source / Mode Options */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#D8BDBB] block">
            Camera Input Source
          </label>
          {isSimulatedMode ? (
            <div className="space-y-2">
              <div className="px-3.5 py-2.5 bg-[#3D251D] border border-[#643C2E] rounded-2xl text-xs text-[#FFDBCF] flex items-center justify-between">
                <span>Synthetic Vision Engine</span>
                <span className="font-mono text-[10px] bg-[#533024] px-2 py-0.5 rounded-full text-[#F7B4A2]">
                  30 FPS
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs text-[#E4CAC8] cursor-pointer pt-0.5">
                <input
                  type="checkbox"
                  checked={injectFlaw}
                  onChange={(e) => setInjectFlaw(e.target.checked)}
                  className="rounded accent-[#F296A1] w-4 h-4 cursor-pointer"
                />
                <span>Simulate Form Flaw (Test live warning audio)</span>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full bg-[#1A1010] border border-[#4C3332] rounded-2xl px-3.5 py-2 text-xs font-medium text-[#F4DFDD] focus:outline-none focus:border-[#F296A1] transition-all cursor-pointer"
                disabled={cameraDevices.length === 0}
              >
                {cameraDevices.length === 0 ? (
                  <option value="">
                    {facingMode === 'environment' ? 'Rear Camera (Environment)' : 'Front Camera (Default)'}
                  </option>
                ) : (
                  cameraDevices.map((d, i) => (
                    <option key={d.deviceId || i} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))
                )}
              </select>
              <div className="text-[11px] text-[#A8908F] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#F296A1]" />
                <span>
                  {facingMode === 'environment'
                    ? 'Prop phone against a bottle or tripod at hip height'
                    : 'Position yourself 6–8 ft away for full-body view'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spatial Calibration Bar & Checklist */}
      <div className="bg-[#1A1010] p-4 rounded-3xl border border-[#3E2A29] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8BAB8]">
              Pose Tracking Calibration
            </span>
            <span
              className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-semibold ${
                calibration.confidenceScore > 75
                  ? 'bg-[#314E30] text-[#B7D9BA] border border-[#487146]'
                  : 'bg-[#533024] text-[#F7B4A2] border border-[#7C4837]'
              }`}
            >
              {calibration.confidenceScore}% Locked
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isStreaming ? (
              <button
                onClick={onStartTracking}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#F296A1] hover:bg-[#F8AAB3] text-[#2D1418] font-bold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-lg shadow-[#F296A1]/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Tracking</span>
              </button>
            ) : (
              <button
                onClick={onStopTracking}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#332221] hover:bg-[#432C2B] text-[#F4DFDD] font-bold text-xs uppercase tracking-wider rounded-full border border-[#523837] transition-all cursor-pointer"
              >
                <span>Pause Stream</span>
              </button>
            )}
          </div>
        </div>

        {/* 5-Point Calibration Checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
          <div className="flex items-center gap-1.5">
            {calibration.headVisible ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B7D9BA] shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-[#593E3C] shrink-0" />
            )}
            <span className={calibration.headVisible ? 'text-[#F3DFDD]' : 'text-[#8C7473]'}>
              Head & Neck
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {calibration.torsoVisible ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B7D9BA] shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-[#593E3C] shrink-0" />
            )}
            <span className={calibration.torsoVisible ? 'text-[#F3DFDD]' : 'text-[#8C7473]'}>
              Shoulders / Torso
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {calibration.hipsVisible ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B7D9BA] shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-[#593E3C] shrink-0" />
            )}
            <span className={calibration.hipsVisible ? 'text-[#F3DFDD]' : 'text-[#8C7473]'}>
              Pelvis / Hips
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {calibration.kneesVisible ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B7D9BA] shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-[#593E3C] shrink-0" />
            )}
            <span className={calibration.kneesVisible ? 'text-[#F3DFDD]' : 'text-[#8C7473]'}>
              Knees
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {calibration.anklesVisible ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B7D9BA] shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-[#593E3C] shrink-0" />
            )}
            <span className={calibration.anklesVisible ? 'text-[#F3DFDD]' : 'text-[#8C7473]'}>
              Feet & Ankles
            </span>
          </div>
        </div>

        {/* Coach Cue banner */}
        <div className="p-3 bg-[#241716] rounded-2xl border border-[#442E2D] text-xs text-[#D8BDBB] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#F296A1] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-[#F296A1]">Trainer Cue: </span>
            <span>{currentInfo.cue}</span>
            <p className="text-[11px] text-[#A68F8E]">
              <strong className="text-[#FF8A80]">Watch out for: </strong>
              {currentInfo.commonMistake}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
