import React from 'react';
import { Dumbbell, Activity, Utensils, Database, Volume2, VolumeX, RotateCcw, Sparkles } from 'lucide-react';
import { ExerciseType, GoalType } from '../types/fitness';

interface NavigationHeaderProps {
  activeTab: 'hud' | 'analytics' | 'nutrition' | 'django';
  setActiveTab: (tab: 'hud' | 'analytics' | 'nutrition' | 'django') => void;
  selectedExercise: ExerciseType;
  selectedGoal: GoalType;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onResetSession: () => void;
  validReps: number;
  targetReps: number;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedExercise,
  selectedGoal,
  isMuted,
  setIsMuted,
  onResetSession,
  validReps,
  targetReps,
}) => {
  const getExerciseLabel = (type: ExerciseType) => {
    switch (type) {
      case 'squat':
        return 'Squats';
      case 'pushup':
        return 'Push-ups';
      case 'bicep_curl':
        return 'Bicep Curls';
      case 'lunge':
        return 'Lunges';
    }
  };

  const getGoalLabel = (goal: GoalType) => {
    switch (goal) {
      case 'strength':
        return 'Strength';
      case 'hypertrophy':
        return 'Hypertrophy';
      case 'form_mastery':
        return 'Form Mastery';
    }
  };

  return (
    <header className="border-b border-[#3D2928] bg-[#1E1413]/90 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Active summary */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            {/* Pixel Material You Squircle Icon */}
            <div className="w-10 h-10 rounded-2xl bg-[#542A31] border border-[#773D47] flex items-center justify-center text-[#FFD9DD] shadow-sm">
              <Dumbbell className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg text-[#F5E2E0] tracking-tight">
                  Gym Form <span className="text-[#F296A1]">AI</span>
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#382423] text-[#E8BAB8] border border-[#533836]">
                  Pixel Material
                </span>
              </div>
              <div className="text-xs text-[#CDB4B2] flex items-center gap-2 mt-0.5 font-medium">
                <span>{getExerciseLabel(selectedExercise)}</span>
                <span className="text-[#593E3C]">·</span>
                <span>{getGoalLabel(selectedGoal)}</span>
                <span className="text-[#593E3C]">·</span>
                <span className="text-[#F296A1] font-mono font-semibold">
                  {validReps} of {targetReps} reps
                </span>
              </div>
            </div>
          </div>

          {/* Mobile fast actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-full border transition-all ${
                isMuted
                  ? 'bg-[#291B1A] border-[#442E2D] text-[#A58E8D]'
                  : 'bg-[#5C2B33] border-[#7F3C47] text-[#FFD9DD]'
              }`}
              title={isMuted ? 'Unmute Voice Coach' : 'Mute Voice Coach'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onResetSession}
              className="p-2.5 rounded-full bg-[#291B1A] border border-[#442E2D] text-[#D8BDBB] hover:text-white"
              title="Reset Set"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Pixel Material You Capsule Segmented Tabs */}
        <nav className="flex items-center p-1.5 bg-[#2A1C1B] border border-[#442E2D] rounded-full w-full md:w-auto overflow-x-auto shadow-inner">
          <button
            onClick={() => setActiveTab('hud')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'hud'
                ? 'bg-[#F296A1] text-[#2C1316] shadow-sm font-bold'
                : 'text-[#D0B7B5] hover:text-white hover:bg-[#382625]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dual Sync HUD</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#F296A1] text-[#2C1316] shadow-sm font-bold'
                : 'text-[#D0B7B5] hover:text-white hover:bg-[#382625]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Session Fatigue</span>
          </button>

          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'nutrition'
                ? 'bg-[#F296A1] text-[#2C1316] shadow-sm font-bold'
                : 'text-[#D0B7B5] hover:text-white hover:bg-[#382625]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Nutrition & TDEE</span>
          </button>

          <button
            onClick={() => setActiveTab('django')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'django'
                ? 'bg-[#F296A1] text-[#2C1316] shadow-sm font-bold'
                : 'text-[#D0B7B5] hover:text-white hover:bg-[#382625]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Django Blueprint</span>
          </button>
        </nav>

        {/* Desktop Quick Tools */}
        <div className="hidden md:flex items-center gap-2.5">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold transition-all cursor-pointer ${
              isMuted
                ? 'bg-[#291B1A] border-[#442E2D] text-[#A58E8D] hover:text-white'
                : 'bg-[#5C2B33] border-[#7F3C47] text-[#FFD9DD] hover:bg-[#6D343E]'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Voice Muted' : 'Voice Coach Active'}</span>
          </button>

          <button
            onClick={onResetSession}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#291B1A] border border-[#442E2D] text-[#E0C7C5] hover:text-white hover:border-[#593E3C] text-xs font-semibold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Set</span>
          </button>
        </div>
      </div>
    </header>
  );
};
