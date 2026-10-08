import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  Volume2,
  VolumeX,
  Zap,
  SplitSquareVertical,
  Maximize2,
  FlipHorizontal,
  RefreshCw,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ExerciseType,
  GoalType,
  Landmark,
  RepPhase,
  RepetitionRecord,
  CalibrationStatus,
  DisplayMode,
  CameraFacingMode,
} from '../types/fitness';
import {
  POSE_LANDMARKS,
  POSE_CONNECTIONS,
  evaluateExerciseForm,
  ExerciseStateMachine,
  BiomechanicalAnalysisResult,
} from '../utils/biomechanics';
import { audioCoach } from '../utils/audioCoach';
import { PoseSimulator } from '../utils/poseSimulator';

interface PoseHUDCanvasProps {
  exercise: ExerciseType;
  goal: GoalType;
  targetReps: number;
  validReps: number;
  setValidReps: React.Dispatch<React.SetStateAction<number>>;
  incompleteReps: number;
  setIncompleteReps: React.Dispatch<React.SetStateAction<number>>;
  onRepCompleted: (repRecord: RepetitionRecord) => void;
  onSetFinished: () => void;
  isStreaming: boolean;
  isSimulatedMode: boolean;
  setIsSimulatedMode: (sim: boolean) => void;
  injectFlaw: boolean;
  selectedDeviceId: string;
  facingMode: CameraFacingMode;
  setFacingMode: (facing: CameraFacingMode) => void;
  isMirrored: boolean;
  setIsMirrored: (mirrored: boolean) => void;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  setCalibration: React.Dispatch<React.SetStateAction<CalibrationStatus>>;
  stateMachineRef: React.MutableRefObject<ExerciseStateMachine>;
}

export const PoseHUDCanvas: React.FC<PoseHUDCanvasProps> = ({
  exercise,
  goal,
  targetReps,
  validReps,
  setValidReps,
  incompleteReps,
  setIncompleteReps,
  onRepCompleted,
  onSetFinished,
  isStreaming,
  isSimulatedMode,
  setIsSimulatedMode,
  injectFlaw,
  selectedDeviceId,
  facingMode,
  setFacingMode,
  isMirrored,
  setIsMirrored,
  displayMode,
  setDisplayMode,
  isMuted,
  setIsMuted,
  setCalibration,
  stateMachineRef,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simFeedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const cameraInstanceRef = useRef<any>(null);
  const simulatorRef = useRef<PoseSimulator>(new PoseSimulator(exercise));

  // HUD telemetry states
  const [currentPhase, setCurrentPhase] = useState<RepPhase>('IDLE');
  const [currentScore, setCurrentScore] = useState<number>(100);
  const [activeDeviations, setActiveDeviations] = useState<string[]>([]);
  const [primaryAngle, setPrimaryAngle] = useState<number>(180);
  const [secondaryAngle, setSecondaryAngle] = useState<number>(0);
  const [fps, setFps] = useState<number>(30);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const lastFrameTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);

  // Sync simulator exercise and flaw
  useEffect(() => {
    simulatorRef.current.setExercise(exercise);
    simulatorRef.current.injectFlaw = injectFlaw;
  }, [exercise, injectFlaw]);

  // Update audio coach muted state
  useEffect(() => {
    audioCoach.setMuted(isMuted);
  }, [isMuted]);

  // Switch facing mode (Front vs Rear)
  const toggleFacing = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (nextFacing === 'environment') {
      setIsMirrored(false);
    } else {
      setIsMirrored(true);
    }
  };

  // Process landmarks (from real camera or simulator)
  const processLandmarks = useCallback(
    (landmarks: Landmark[], width: number, height: number) => {
      if (!landmarks || landmarks.length < 33) return;

      // 1. Evaluate spatial calibration
      const headVisible = (landmarks[POSE_LANDMARKS.NOSE]?.visibility ?? 1) > 0.5;
      const torsoVisible =
        (landmarks[POSE_LANDMARKS.LEFT_SHOULDER]?.visibility ?? 1) > 0.5 &&
        (landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]?.visibility ?? 1) > 0.5;
      const hipsVisible =
        (landmarks[POSE_LANDMARKS.LEFT_HIP]?.visibility ?? 1) > 0.5 ||
        (landmarks[POSE_LANDMARKS.RIGHT_HIP]?.visibility ?? 1) > 0.5;
      const kneesVisible =
        (landmarks[POSE_LANDMARKS.LEFT_KNEE]?.visibility ?? 1) > 0.5 ||
        (landmarks[POSE_LANDMARKS.RIGHT_KNEE]?.visibility ?? 1) > 0.5;
      const anklesVisible =
        (landmarks[POSE_LANDMARKS.LEFT_ANKLE]?.visibility ?? 1) > 0.5 ||
        (landmarks[POSE_LANDMARKS.RIGHT_ANKLE]?.visibility ?? 1) > 0.5;

      const visiblePoints = [headVisible, torsoVisible, hipsVisible, kneesVisible, anklesVisible].filter(
        Boolean
      ).length;
      const confidence = Math.round((visiblePoints / 5) * 100);

      setCalibration({
        headVisible,
        torsoVisible,
        hipsVisible,
        kneesVisible,
        anklesVisible,
        distanceAdequate: visiblePoints >= 4,
        confidenceScore: confidence,
      });

      // 2. Evaluate biomechanics & angles
      const analysis: BiomechanicalAnalysisResult = evaluateExerciseForm(exercise, landmarks);
      setPrimaryAngle(analysis.primaryAngle);
      setSecondaryAngle(analysis.secondaryAngle);
      setCurrentScore(analysis.formScore);

      const deviationMessages = analysis.deviations.map((d) => d.message);
      setActiveDeviations(deviationMessages);

      // Voice coaching warnings
      if (analysis.deviations.length > 0) {
        audioCoach.coachFormError(analysis.deviations[0].recommendedCorrection);
      }

      // 3. Step biomechanical state machine
      const smResult = stateMachineRef.current.processFrame(analysis, Date.now());

      if (smResult.phaseChanged) {
        setCurrentPhase(smResult.currentPhase);
      }

      if (smResult.repCompleted && smResult.repRecord) {
        setValidReps(smResult.repCount);
        audioCoach.coachRepCount(smResult.repCount);
        onRepCompleted(smResult.repRecord);

        // Check target set finish
        if (smResult.repCount >= targetReps) {
          audioCoach.speak(`Set complete! ${targetReps} reps achieved.`, true);
          onSetFinished();
        }
      }

      if (smResult.isIncompleteRep) {
        setIncompleteReps(smResult.incompleteRepCount);
        audioCoach.coachIncompleteRep();
      }

      // 4. Render on Synced Tracking Canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);

      // Material You Dark Warm Brown Canvas Background
      ctx.fillStyle = '#1B1111';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle organic geometric grid lines
      ctx.strokeStyle = '#2D1D1C';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 45) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let x = 0; x < width; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Center of Gravity / Balance Plumb Line (vertical plumb line from head to floor)
      const nose = landmarks[POSE_LANDMARKS.NOSE];
      if (nose && (nose.visibility ?? 1) > 0.4) {
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(235, 179, 167, 0.45)'; // Material You Warm Peach
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(nose.x * width, 0);
        ctx.lineTo(nose.x * width, height);
        ctx.stroke();
        ctx.restore();
      }

      // Biomechanical Color Palette (Material You Brown-Pink)
      const hasCriticalDeviation = analysis.deviations.some((d) => d.severity === 'critical');
      const hasWarning = analysis.deviations.length > 0;
      // Normal/Good: M3 Blush Rose (#F296A1), Deviating: Coral Red (#FF8A80), Optimal Lockout: Mint Sage (#B7D9BA)
      const skeletonColor = hasCriticalDeviation
        ? '#FF8A80'
        : hasWarning
        ? '#F7B4A2'
        : '#F296A1';

      // Draw Skeleton Bones
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = skeletonColor;

      POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const ptA = landmarks[startIdx];
        const ptB = landmarks[endIdx];
        if (!ptA || !ptB) return;
        if ((ptA.visibility ?? 1) < 0.25 || (ptB.visibility ?? 1) < 0.25) return;

        ctx.beginPath();
        ctx.moveTo(ptA.x * width, ptA.y * height);
        ctx.lineTo(ptB.x * width, ptB.y * height);
        ctx.stroke();
      });

      // Draw 33 Key Joints
      landmarks.forEach((pt, index) => {
        if (!pt || (pt.visibility ?? 1) < 0.25) return;
        const x = pt.x * width;
        const y = pt.y * height;

        const isKeyVertex =
          index === POSE_LANDMARKS.LEFT_KNEE ||
          index === POSE_LANDMARKS.RIGHT_KNEE ||
          index === POSE_LANDMARKS.LEFT_ELBOW ||
          index === POSE_LANDMARKS.RIGHT_ELBOW ||
          index === POSE_LANDMARKS.LEFT_HIP ||
          index === POSE_LANDMARKS.RIGHT_HIP;

        if (isKeyVertex) {
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, 2 * Math.PI);
          ctx.fillStyle = hasCriticalDeviation
            ? 'rgba(255, 138, 128, 0.3)'
            : 'rgba(242, 150, 161, 0.28)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, isKeyVertex ? 5.5 : 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = isKeyVertex ? '#FFF0F2' : skeletonColor;
        ctx.fill();
        ctx.strokeStyle = skeletonColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Dynamic Angular Arc & Angle Capsule Badge
      const vertexB = analysis.keyPoints.vertexB;
      if (vertexB && (vertexB.visibility ?? 1) > 0.35) {
        const vx = vertexB.x * width;
        const vy = vertexB.y * height;

        // Visual Arc
        ctx.beginPath();
        ctx.arc(vx, vy, 30, -Math.PI / 4, Math.PI / 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = skeletonColor;
        ctx.stroke();

        // Material You Capsule Angle Pill
        const angleLabel = `${analysis.primaryAngle}°`;
        ctx.font = 'bold 13px "Plus Jakarta Sans", system-ui, sans-serif';
        const textMetrics = ctx.measureText(angleLabel);
        const badgeW = textMetrics.width + 18;
        const badgeH = 24;
        const badgeX = Math.min(width - badgeW - 10, vx + 16);
        const badgeY = Math.max(10, vy - 14);

        ctx.fillStyle = '#2D1A1A';
        ctx.strokeStyle = skeletonColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFD9DD';
        ctx.fillText(angleLabel, badgeX + 9, badgeY + 16);
      }

      // If in Simulator Mode, also draw the clean body silhouette on the left pane
      if (isSimulatedMode && simFeedCanvasRef.current) {
        const simCanvas = simFeedCanvasRef.current;
        const simCtx = simCanvas.getContext('2d');
        if (simCtx) {
          if (simCanvas.width !== width || simCanvas.height !== height) {
            simCanvas.width = width;
            simCanvas.height = height;
          }
          simCtx.clearRect(0, 0, width, height);
          simCtx.fillStyle = '#150E0E';
          simCtx.fillRect(0, 0, width, height);

          // Simulated athlete gym floor line
          simCtx.strokeStyle = '#3E2A29';
          simCtx.lineWidth = 2;
          simCtx.beginPath();
          simCtx.moveTo(0, height * 0.94);
          simCtx.lineTo(width, height * 0.94);
          simCtx.stroke();

          // Draw lifter silhouette (solid body)
          simCtx.strokeStyle = '#5A3D3B';
          simCtx.lineWidth = 16;
          simCtx.lineCap = 'round';
          simCtx.lineJoin = 'round';
          POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
            const ptA = landmarks[startIdx];
            const ptB = landmarks[endIdx];
            if (!ptA || !ptB) return;
            simCtx.beginPath();
            simCtx.moveTo(ptA.x * width, ptA.y * height);
            simCtx.lineTo(ptB.x * width, ptB.y * height);
            simCtx.stroke();
          });
        }
      }

      // FPS Calculation
      frameCountRef.current++;
      const now = Date.now();
      if (now - lastFrameTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }
    },
    [
      exercise,
      isSimulatedMode,
      onRepCompleted,
      onSetFinished,
      setCalibration,
      setIncompleteReps,
      setValidReps,
      stateMachineRef,
      targetReps,
    ]
  );

  // Setup Camera / Simulation Frame Loop
  useEffect(() => {
    let active = true;

    if (!isStreaming) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      return;
    }

    if (isSimulatedMode) {
      const runSimulator = () => {
        if (!active) return;
        const landmarks = simulatorRef.current.getCurrentFrame();
        const canvas = canvasRef.current;
        const width = canvas ? canvas.clientWidth || 640 : 640;
        const height = canvas ? canvas.clientHeight || 480 : 480;
        processLandmarks(landmarks, width, height);
        animFrameIdRef.current = requestAnimationFrame(runSimulator);
      };

      runSimulator();

      return () => {
        active = false;
        if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      };
    }

    // Live Camera initialization
    const initLiveCamera = async () => {
      try {
        setCameraError(null);
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const PoseConstructor = (window as any).Pose;
        const CameraConstructor = (window as any).Camera;

        if (!PoseConstructor || !CameraConstructor) {
          setCameraError('MediaPipe Vision library loading. Switched to Simulator mode.');
          setIsSimulatedMode(true);
          return;
        }

        const pose = new PoseConstructor({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        pose.onResults((results: any) => {
          if (!active) return;
          if (results.poseLandmarks) {
            const width = videoElement.videoWidth || 640;
            const height = videoElement.videoHeight || 480;
            processLandmarks(results.poseLandmarks, width, height);
          }
        });

        // Use selected device ID or facing mode (Rear vs Front)
        const videoConstraints: MediaTrackConstraints = selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: 1280, height: 720 }
          : {
              facingMode: { ideal: facingMode }, // 'environment' (rear) or 'user' (front)
              width: 1280,
              height: 720,
            };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        videoElement.srcObject = stream;
        await videoElement.play();

        const camera = new CameraConstructor(videoElement, {
          onFrame: async () => {
            if (active && videoElement) {
              await pose.send({ image: videoElement });
            }
          },
          width: 1280,
          height: 720,
        });

        camera.start();
        cameraInstanceRef.current = { camera, stream, pose };
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        setCameraError(
          'Webcam access unavailable or permission denied. Switched to Synchronized Simulation mode.'
        );
        setIsSimulatedMode(true);
      }
    };

    initLiveCamera();

    return () => {
      active = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (cameraInstanceRef.current?.stream) {
        try {
          cameraInstanceRef.current.stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        } catch {
          // cleanup
        }
      }
    };
  }, [facingMode, isSimulatedMode, isStreaming, processLandmarks, selectedDeviceId, setIsSimulatedMode]);

  // Phase badges in Material You colors
  const getPhaseColor = (p: RepPhase) => {
    switch (p) {
      case 'ECCENTRIC':
        return 'text-[#F7B4A2] border-[#7C4837] bg-[#432319]';
      case 'INFLECTION':
        return 'text-[#FFD9DD] border-[#9E4D5B] bg-[#542A31] glow-m3-rose';
      case 'CONCENTRIC':
        return 'text-[#B7D9BA] border-[#487146] bg-[#223921]';
      default:
        return 'text-[#D0B7B5] border-[#4E3534] bg-[#2B1B1A]';
    }
  };

  return (
    <div className="w-full rounded-3xl overflow-hidden bg-[#1E1313] border border-[#442E2D] shadow-2xl flex flex-col space-y-3 p-4">
      {/* Top Toolbar: Dual-Sync Display Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#261817] p-3 rounded-2xl border border-[#3E2A29]">
        <div className="flex items-center gap-2">
          {/* Synchronized status badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#352120] border border-[#523735] text-xs font-semibold text-[#F4DFDD]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B7D9BA] animate-pulse" />
            <span>Dual Sync Lockstep</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#352120] text-xs font-mono text-[#D8BDBB]">
            <Zap className="w-3.5 h-3.5 text-[#F296A1]" />
            <span>{fps} FPS</span>
          </div>
        </div>

        {/* Display Mode Segmented Switch: Side-by-Side vs PiP vs Overlay */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <div className="flex items-center p-1 bg-[#1A1010] border border-[#442E2D] rounded-full">
            <button
              onClick={() => setDisplayMode('side_by_side')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                displayMode === 'side_by_side'
                  ? 'bg-[#F296A1] text-[#2D1418] font-bold shadow-sm'
                  : 'text-[#D0B7B5] hover:text-white'
              }`}
              title="Side-by-Side Dual View (Camera Footage + Synced Tracking)"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>

            <button
              onClick={() => setDisplayMode('pip')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                displayMode === 'pip'
                  ? 'bg-[#F296A1] text-[#2D1418] font-bold shadow-sm'
                  : 'text-[#D0B7B5] hover:text-white'
              }`}
              title="Picture-in-Picture Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>PiP</span>
            </button>

            <button
              onClick={() => setDisplayMode('overlay')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                displayMode === 'overlay'
                  ? 'bg-[#F296A1] text-[#2D1418] font-bold shadow-sm'
                  : 'text-[#D0B7B5] hover:text-white'
              }`}
              title="Direct Overlay Mode"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Overlay</span>
            </button>
          </div>

          {/* Quick Rear / Front Toggle */}
          {!isSimulatedMode && (
            <button
              onClick={toggleFacing}
              className="p-2 rounded-full bg-[#352120] border border-[#523735] text-[#FFD9DD] hover:bg-[#482D2B] transition-all cursor-pointer"
              title={
                facingMode === 'environment'
                  ? 'Switch to Front Camera'
                  : 'Switch to Rear Camera (Environment)'
              }
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Audio Mute */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isMuted
                ? 'bg-[#2B1B1A] border-[#442E2D] text-[#A58E8D]'
                : 'bg-[#542A31] border-[#7F3C47] text-[#FFD9DD]'
            }`}
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Camera error alert banner */}
      {cameraError && (
        <div className="bg-[#48241F] border border-[#783D32] p-3 rounded-2xl text-xs text-[#FFDBCF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F7B4A2] shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => setCameraError(null)}
            className="text-[#FFDBCF] hover:text-white px-2 py-0.5 font-bold"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* SYNCHRONIZED DUAL VIEWPORT CONTAINER */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#160E0E]">
        {/* MODE A: SIDE-BY-SIDE SYNCHRONIZED SPLIT VIEW */}
        {displayMode === 'side_by_side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
            {/* PANE 1: REAL CAMERA FOOTAGE (CLEAN) */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-black border border-[#3E2A29] flex items-center justify-center shadow-md">
              {!isSimulatedMode ? (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
                />
              ) : (
                <canvas ref={simFeedCanvasRef} className="w-full h-full object-cover" />
              )}

              {/* Pane 1 Header Badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#1F1414]/90 backdrop-blur-md border border-[#442E2D] text-xs font-semibold text-[#FFD9DD] flex items-center gap-1.5 shadow-sm">
                  <Camera className="w-3.5 h-3.5 text-[#F296A1]" />
                  <span>
                    Camera Footage {facingMode === 'environment' ? '(Rear)' : '(Front)'}
                  </span>
                </span>
              </div>

              {/* Pane 1 Bottom Info */}
              <div className="absolute bottom-3 left-3 z-20">
                <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#1F1414]/90 border border-[#3D2827] text-[#D8BDBB]">
                  Raw Unmodified Stream
                </span>
              </div>
            </div>

            {/* PANE 2: BIOMECHANICAL TRACKING SYSTEM (SKELETON & ANGLES) */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#1B1111] border border-[#523735] flex items-center justify-center shadow-md">
              <canvas
                ref={canvasRef}
                className={`w-full h-full object-cover ${
                  !isSimulatedMode && isMirrored ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Pane 2 Header Badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#2E1A1B]/90 backdrop-blur-md border border-[#5E3038] text-xs font-bold text-[#FFD9DD] flex items-center gap-1.5 shadow-sm">
                  <Activity className="w-3.5 h-3.5 text-[#F296A1]" />
                  <span>Biomechanics System (Synced)</span>
                </span>
              </div>

              {/* Dynamic Rep Phase & Accuracy */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${getPhaseColor(
                    currentPhase
                  )}`}
                >
                  {currentPhase}
                </span>
              </div>

              {/* Pane 2 Angle Telemetry Overlay */}
              <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between">
                <div className="px-3 py-1.5 rounded-2xl bg-[#281818]/90 backdrop-blur-md border border-[#4A302F] flex items-center gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-[#C6ABAA] block uppercase font-bold">
                      Joint Flexion
                    </span>
                    <span className="font-mono font-bold text-base text-[#F296A1]">
                      {primaryAngle}°
                    </span>
                  </div>
                  <div className="w-px h-6 bg-[#4A302F]" />
                  <div>
                    <span className="text-[10px] text-[#C6ABAA] block uppercase font-bold">
                      Torso Tilt
                    </span>
                    <span className="font-mono font-bold text-base text-[#F7B4A2]">
                      {secondaryAngle}°
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-2xl bg-[#281818]/90 backdrop-blur-md border border-[#4A302F] text-right">
                  <span className="text-[10px] text-[#C6ABAA] block uppercase font-bold">Form</span>
                  <span className="font-mono font-bold text-base text-[#FFD9DD]">
                    {currentScore}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE B: PICTURE-IN-PICTURE (PiP) */}
        {displayMode === 'pip' && (
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black border border-[#3E2A29]">
            {/* Primary Main View: Raw Camera */}
            {!isSimulatedMode ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
              />
            ) : (
              <canvas ref={simFeedCanvasRef} className="w-full h-full object-cover" />
            )}

            {/* Floating PiP View: Synced Tracking Canvas */}
            <div className="absolute top-4 right-4 w-1/3 aspect-[4/3] rounded-2xl overflow-hidden border-2 border-[#F296A1] shadow-2xl z-30 bg-[#1B1111]">
              <canvas
                ref={canvasRef}
                className={`w-full h-full object-cover ${
                  !isSimulatedMode && isMirrored ? 'scale-x-[-1]' : ''
                }`}
              />
              <div className="absolute bottom-1.5 left-2 bg-[#2D1619]/90 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#FFD9DD] border border-[#6B323C]">
                Tracking PiP
              </div>
            </div>

            {/* Top Left Status */}
            <div className="absolute top-4 left-4 z-20">
              <span className="px-3.5 py-1.5 rounded-full bg-[#1F1414]/90 backdrop-blur-md border border-[#442E2D] text-xs font-semibold text-[#FFD9DD] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#F296A1]" />
                <span>Camera Footage {facingMode === 'environment' ? '(Rear)' : '(Front)'}</span>
              </span>
            </div>
          </div>
        )}

        {/* MODE C: DIRECT OVERLAY */}
        {displayMode === 'overlay' && (
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black border border-[#3E2A29]">
            {!isSimulatedMode && (
              <video
                ref={videoRef}
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${
                  isMirrored ? 'scale-x-[-1]' : ''
                }`}
              />
            )}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover z-10 ${
                !isSimulatedMode && isMirrored ? 'scale-x-[-1]' : ''
              }`}
            />
          </div>
        )}

        {/* Real-Time Form Deviation Banner in Material You Coral */}
        {activeDeviations.length > 0 && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-lg w-11/12 animate-in fade-in slide-in-from-top duration-200">
            <div className="bg-[#481E1E]/95 border border-[#8C3A3A] p-3.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#6B2828] flex items-center justify-center text-[#FFB4AB] shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs uppercase tracking-wide text-[#FFDAD6]">
                  Biomechanical Deviation
                </div>
                <div className="text-xs text-[#FFB4AB] font-medium truncate">
                  {activeDeviations[0]}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Rep Progress & Phase Flow in Material You Brown-Pink Palette */}
      <div className="bg-[#241716] p-4 rounded-2xl border border-[#3E2A29] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Rep Count Tally */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#542A31] border border-[#7B3C47] flex items-center justify-center text-[#FFD9DD]">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider block">
                  Completed Reps
                </span>
                <span className="font-mono text-2xl font-bold text-[#F296A1]">
                  {validReps}
                  <span className="text-xs text-[#8C7473] font-normal"> / {targetReps} reps</span>
                </span>
              </div>
            </div>

            <div className="w-px h-8 bg-[#3E2A29]" />

            <div>
              <span className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider block">
                Incomplete Reps
              </span>
              <span className="font-mono text-2xl font-bold text-[#F7B4A2]">
                {incompleteReps}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onSetFinished}
              disabled={validReps === 0 && incompleteReps === 0}
              className="px-5 py-2.5 bg-[#F296A1] hover:bg-[#F8AAB3] text-[#2D1418] font-bold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-lg shadow-[#F296A1]/20 disabled:opacity-40"
            >
              Complete Set & Review
            </button>
          </div>
        </div>

        {/* Phase State Machine Step Visualizer */}
        <div className="grid grid-cols-4 gap-2 text-xs pt-1">
          <div
            className={`p-2 rounded-xl border text-center transition-all ${
              currentPhase === 'START'
                ? 'bg-[#542A31] border-[#9E4D5B] text-[#FFD9DD] font-bold'
                : 'bg-[#1A1010] border-[#3E2A29] text-[#8C7473]'
            }`}
          >
            1. START
          </div>
          <div
            className={`p-2 rounded-xl border text-center transition-all ${
              currentPhase === 'ECCENTRIC'
                ? 'bg-[#533024] border-[#8A4F3C] text-[#FFDBCF] font-bold'
                : 'bg-[#1A1010] border-[#3E2A29] text-[#8C7473]'
            }`}
          >
            2. ECCENTRIC
          </div>
          <div
            className={`p-2 rounded-xl border text-center transition-all ${
              currentPhase === 'INFLECTION'
                ? 'bg-[#542A31] border-[#9E4D5B] text-[#FFD9DD] font-bold glow-m3-rose'
                : 'bg-[#1A1010] border-[#3E2A29] text-[#8C7473]'
            }`}
          >
            3. DEPTH INFLECTION
          </div>
          <div
            className={`p-2 rounded-xl border text-center transition-all ${
              currentPhase === 'CONCENTRIC'
                ? 'bg-[#294228] border-[#487146] text-[#D0EDCE] font-bold'
                : 'bg-[#1A1010] border-[#3E2A29] text-[#8C7473]'
            }`}
          >
            4. CONCENTRIC
          </div>
        </div>
      </div>
    </div>
  );
};
