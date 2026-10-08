/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ExerciseType,
  GoalType,
  RepetitionRecord,
  WorkoutSessionSummary,
  CalibrationStatus,
  NutritionProfile,
  DisplayMode,
  CameraFacingMode,
} from './types/fitness';
import { ExerciseStateMachine } from './utils/biomechanics';
import { NavigationHeader } from './components/NavigationHeader';
import { WorkoutSetupPanel } from './components/WorkoutSetupPanel';
import { PoseHUDCanvas } from './components/PoseHUDCanvas';
import { SessionAnalyticsModal } from './components/SessionAnalyticsModal';
import { NutritionModule } from './components/NutritionModule';
import { DjangoBlueprintView } from './components/DjangoBlueprintView';
import {
  Activity,
  Award,
  Calendar,
  Dumbbell,
  Flame,
  Info,
  Layers,
  Sparkles,
  Trophy,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'hud' | 'analytics' | 'nutrition' | 'django'>('hud');

  // Exercise & Session Config
  const [exercise, setExercise] = useState<ExerciseType>('squat');
  const [goal, setGoal] = useState<GoalType>('hypertrophy');
  const [targetReps, setTargetReps] = useState<number>(10);

  // Vision stream settings & Dual View Controls
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [injectFlaw, setInjectFlaw] = useState<boolean>(false);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<CameraFacingMode>('user'); // 'user' = Front, 'environment' = Rear
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('side_by_side'); // Default to side-by-side sync!

  // Audio Coach
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Calibration
  const [calibration, setCalibration] = useState<CalibrationStatus>({
    headVisible: true,
    torsoVisible: true,
    hipsVisible: true,
    kneesVisible: true,
    anklesVisible: true,
    distanceAdequate: true,
    confidenceScore: 95,
  });

  // Active workout metrics
  const [validReps, setValidReps] = useState<number>(0);
  const [incompleteReps, setIncompleteReps] = useState<number>(0);
  const [completedRepRecords, setCompletedRepRecords] = useState<RepetitionRecord[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());

  // Analytics & History
  const [currentSummary, setCurrentSummary] = useState<WorkoutSessionSummary | null>(null);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState<boolean>(false);
  const [sessionHistory, setSessionHistory] = useState<WorkoutSessionSummary[]>([]);

  // State Machine instance ref
  const stateMachineRef = useRef<ExerciseStateMachine>(new ExerciseStateMachine(exercise));

  // Enumerate cameras on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevs = devices.filter((d) => d.kind === 'videoinput');
          setCameraDevices(videoDevs);
          if (videoDevs.length > 0) {
            setSelectedDeviceId(videoDevs[0].deviceId);
          }
        })
        .catch((err) => {
          console.warn('Could not enumerate camera devices:', err);
        });
    }
  }, []);

  // Update State Machine when exercise changes
  const handleExerciseChange = (newExercise: ExerciseType) => {
    setExercise(newExercise);
    stateMachineRef.current.setExercise(newExercise);
    handleResetSession();
  };

  const handleRepCompleted = (repRecord: RepetitionRecord) => {
    setCompletedRepRecords((prev) => [...prev, repRecord]);
  };

  const handleSetFinished = () => {
    const reps = completedRepRecords;
    const avgScore =
      reps.length > 0
        ? Math.round(reps.reduce((acc, r) => acc + r.formScore, 0) / reps.length)
        : 90;

    const initialScore = reps.length > 0 ? reps[0].formScore : 100;
    const lastScore = reps.length > 0 ? reps[reps.length - 1].formScore : 100;
    const fatigue = Math.max(0, initialScore - lastScore);

    const mistakeCountMap = new Map<string, number>();
    reps.forEach((r) => {
      r.deviations.forEach((d) => {
        mistakeCountMap.set(d, (mistakeCountMap.get(d) || 0) + 1);
      });
    });

    const commonMistakes = Array.from(mistakeCountMap.entries()).map(([mistake, count]) => ({
      mistake,
      count,
    }));

    const summary: WorkoutSessionSummary = {
      id: `sess_${Date.now()}`,
      exercise,
      goal,
      targetReps,
      totalValidReps: validReps,
      totalIncompleteReps: incompleteReps,
      averageFormScore: avgScore,
      durationSeconds: Math.round((Date.now() - sessionStartTime) / 1000),
      fatigueIndex: fatigue,
      repetitions: reps,
      commonMistakes,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCurrentSummary(summary);
    setSessionHistory((prev) => [summary, ...prev]);
    setIsAnalyticsModalOpen(true);
  };

  const handleResetSession = () => {
    stateMachineRef.current.reset();
    setValidReps(0);
    setIncompleteReps(0);
    setCompletedRepRecords([]);
    setSessionStartTime(Date.now());
  };

  const handleStartNewSet = () => {
    setIsAnalyticsModalOpen(false);
    handleResetSession();
    setActiveTab('hud');
  };

  const handleSyncToDjango = async (summary: WorkoutSessionSummary) => {
    await new Promise((res) => setTimeout(res, 800));
    return {
      success: true,
      message: `Persisted session ${summary.id} to Django WorkoutSession model!`,
    };
  };

  const handleSyncNutritionToDjango = async (profile: NutritionProfile) => {
    await new Promise((res) => setTimeout(res, 700));
    return true;
  };

  return (
    <div className="min-h-screen bg-[#160E0E] text-[#F4DFDD] flex flex-col font-sans selection:bg-[#F296A1] selection:text-[#2D1418]">
      {/* Navigation & Global Header */}
      <NavigationHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedExercise={exercise}
        selectedGoal={goal}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onResetSession={handleResetSession}
        validReps={validReps}
        targetReps={targetReps}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-7 space-y-6">
        {activeTab === 'hud' && (
          <div className="space-y-6">
            {/* Setup & Calibration Toolbar */}
            <WorkoutSetupPanel
              exercise={exercise}
              setExercise={handleExerciseChange}
              goal={goal}
              setGoal={setGoal}
              targetReps={targetReps}
              setTargetReps={setTargetReps}
              cameraDevices={cameraDevices}
              selectedDeviceId={selectedDeviceId}
              setSelectedDeviceId={setSelectedDeviceId}
              facingMode={facingMode}
              setFacingMode={setFacingMode}
              isMirrored={isMirrored}
              setIsMirrored={setIsMirrored}
              isSimulatedMode={isSimulatedMode}
              setIsSimulatedMode={setIsSimulatedMode}
              injectFlaw={injectFlaw}
              setInjectFlaw={setInjectFlaw}
              calibration={calibration}
              isStreaming={isStreaming}
              onStartTracking={() => setIsStreaming(true)}
              onStopTracking={() => setIsStreaming(false)}
            />

            {/* Synchronized Pose HUD Dual View */}
            <div className="space-y-6">
              <PoseHUDCanvas
                exercise={exercise}
                goal={goal}
                targetReps={targetReps}
                validReps={validReps}
                setValidReps={setValidReps}
                incompleteReps={incompleteReps}
                setIncompleteReps={setIncompleteReps}
                onRepCompleted={handleRepCompleted}
                onSetFinished={handleSetFinished}
                isStreaming={isStreaming}
                isSimulatedMode={isSimulatedMode}
                setIsSimulatedMode={setIsSimulatedMode}
                injectFlaw={injectFlaw}
                selectedDeviceId={selectedDeviceId}
                facingMode={facingMode}
                setFacingMode={setFacingMode}
                isMirrored={isMirrored}
                setIsMirrored={setIsMirrored}
                displayMode={displayMode}
                setDisplayMode={setDisplayMode}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                setCalibration={setCalibration}
                stateMachineRef={stateMachineRef}
              />

              {/* Bottom Quick Rep Stream Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Rep Stream Log */}
                <div className="md:col-span-2 bg-[#241716] border border-[#442E2D] rounded-3xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-[#F296A1]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#F4DFDD]">
                        Live Rep Log Stream
                      </span>
                    </div>
                    <span className="text-xs text-[#A8908F] font-mono">
                      {completedRepRecords.length} reps recorded
                    </span>
                  </div>

                  {completedRepRecords.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#8C7473] border border-dashed border-[#442E2D] rounded-2xl">
                      Perform repetitions in view of the camera to see instant feedback.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                      {completedRepRecords
                        .slice()
                        .reverse()
                        .map((rep, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-2xl bg-[#1A1010] border border-[#3E2A29] flex flex-col justify-between text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-[#F296A1]">
                                Rep #{rep.repNumber}
                              </span>
                              <span className="font-mono text-[11px] text-[#A8908F]">
                                {(rep.durationMs / 1000).toFixed(1)}s
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[11px] text-[#C6ABAA]">Form:</span>
                              <span
                                className={`font-mono font-bold ${
                                  rep.formScore >= 80 ? 'text-[#B7D9BA]' : 'text-[#F7B4A2]'
                                }`}
                              >
                                {rep.formScore}%
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Material You Voice Coach Info Card */}
                <div className="bg-[#241716] border border-[#442E2D] rounded-3xl p-5 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#FFD9DD] font-semibold text-xs">
                      <Sparkles className="w-4 h-4 text-[#F296A1]" />
                      <span>Pixel Voice Coach Feedback</span>
                    </div>
                    <p className="text-[#C6ABAA] text-xs leading-relaxed mt-2">
                      Hands-free audio cues automatically trigger when form deviates (such as knees caving or hips sagging). Successful reps are announced with an acoustic chime.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-[#3E2A29] flex items-center justify-between text-xs text-[#E8BAB8]">
                    <span>Camera: {facingMode === 'environment' ? 'Rear (Back)' : 'Front (Selfie)'}</span>
                    <span>Status: {isMuted ? 'Muted' : 'Speaking'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {currentSummary ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display font-bold text-lg text-[#F4DFDD]">
                      Set Evaluation & Fatigue Curve
                    </h2>
                    <p className="text-xs text-[#C6ABAA]">
                      Kinematic accuracy drop-off and common error patterns
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAnalyticsModalOpen(true)}
                    className="px-4 py-2 bg-[#F296A1] hover:bg-[#F8AAB3] text-[#2D1418] text-xs font-bold uppercase rounded-full transition-all cursor-pointer shadow-md"
                  >
                    Open Full Breakdown
                  </button>
                </div>

                {/* Inline analytics summary in Material You Brown-Pink cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#241716] border border-[#442E2D] p-4 rounded-3xl">
                    <span className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider">
                      Exercise
                    </span>
                    <div className="font-display font-bold text-xl text-[#F4DFDD] mt-1 capitalize">
                      {currentSummary.exercise}
                    </div>
                  </div>
                  <div className="bg-[#241716] border border-[#442E2D] p-4 rounded-3xl">
                    <span className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider">
                      Completed Reps
                    </span>
                    <div className="font-mono font-bold text-xl text-[#F296A1] mt-1">
                      {currentSummary.totalValidReps} / {currentSummary.targetReps}
                    </div>
                  </div>
                  <div className="bg-[#241716] border border-[#442E2D] p-4 rounded-3xl">
                    <span className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider">
                      Accuracy Score
                    </span>
                    <div className="font-mono font-bold text-xl text-[#B7D9BA] mt-1">
                      {currentSummary.averageFormScore}%
                    </div>
                  </div>
                  <div className="bg-[#241716] border border-[#442E2D] p-4 rounded-3xl">
                    <span className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider">
                      Fatigue Drop
                    </span>
                    <div className="font-mono font-bold text-xl text-[#FF8A80] mt-1">
                      {currentSummary.fatigueIndex}% drop
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#241716] border border-[#442E2D] rounded-3xl p-12 text-center space-y-4">
                <Activity className="w-8 h-8 text-[#F296A1] mx-auto" />
                <h3 className="font-display font-bold text-lg text-[#F4DFDD]">No Completed Sets Yet</h3>
                <p className="text-xs text-[#C6ABAA] max-w-md mx-auto">
                  Switch to the Dual Sync HUD, complete a set of squats, pushups, curls, or lunges, and your fatigue metrics will appear here.
                </p>
                <button
                  onClick={() => setActiveTab('hud')}
                  className="px-5 py-2.5 bg-[#F296A1] hover:bg-[#F8AAB3] text-[#2D1418] font-bold text-xs uppercase rounded-full transition-all cursor-pointer"
                >
                  Start Workout Set
                </button>
              </div>
            )}

            {/* Session History Log */}
            {sessionHistory.length > 0 && (
              <div className="bg-[#241716] border border-[#442E2D] rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F296A1]" />
                  <h3 className="font-display font-bold text-sm text-[#F4DFDD] uppercase tracking-wider">
                    Recent Sets Log
                  </h3>
                </div>

                <div className="space-y-2">
                  {sessionHistory.map((sess, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-[#1A1010] border border-[#3E2A29] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold uppercase text-[#F4DFDD]">
                          {sess.exercise}
                        </span>
                        <span className="text-[#593E3C]">·</span>
                        <span className="text-[#C6ABAA]">{sess.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-4 font-mono">
                        <span className="text-[#F296A1] font-bold">{sess.totalValidReps} reps</span>
                        <span className="text-[#B7D9BA] font-bold">{sess.averageFormScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nutrition' && (
          <NutritionModule onSyncNutritionToDjango={handleSyncNutritionToDjango} />
        )}

        {activeTab === 'django' && <DjangoBlueprintView currentSession={currentSummary} />}
      </main>

      {/* Session Analytics Modal */}
      <SessionAnalyticsModal
        summary={currentSummary}
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        onStartNewSet={handleStartNewSet}
        onSyncToDjango={handleSyncToDjango}
      />
    </div>
  );
}
