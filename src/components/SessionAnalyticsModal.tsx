import React, { useState } from 'react';
import {
  X,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Award,
  Database,
  Download,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { WorkoutSessionSummary } from '../types/fitness';

interface SessionAnalyticsModalProps {
  summary: WorkoutSessionSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onStartNewSet: () => void;
  onSyncToDjango: (summary: WorkoutSessionSummary) => Promise<{ success: boolean; message: string }>;
}

export const SessionAnalyticsModal: React.FC<SessionAnalyticsModalProps> = ({
  summary,
  isOpen,
  onClose,
  onStartNewSet,
  onSyncToDjango,
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen || !summary) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await onSyncToDjango(summary);
      setSyncStatus(res);
    } catch {
      setSyncStatus({ success: false, message: 'Connection to Django server failed.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(summary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `gym_form_session_${summary.exercise}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const reps = summary.repetitions;
  const initialRepScore = reps.length > 0 ? reps[0].formScore : 100;
  const lastRepScore = reps.length > 0 ? reps[reps.length - 1].formScore : 100;
  const degradationPct = Math.max(0, initialRepScore - lastRepScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#241716] border border-[#483130] rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-6 shadow-2xl relative my-8 text-[#F4DFDD]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#C6ABAA] hover:text-white p-2 rounded-full bg-[#352120] border border-[#4E3534] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-[#3E2A29] pb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#542A31] border border-[#7F3C47] flex items-center justify-center text-[#FFD9DD]">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#F4DFDD]">
              Post-Set Analytics & Fatigue Curve
            </h2>
            <p className="text-xs text-[#C6ABAA]">
              Biomechanical evaluation & muscular stability report for {summary.exercise.toUpperCase()}
            </p>
          </div>
        </div>

        {/* KPI Metrics Grid in Material You Style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#1A1010] p-4 rounded-2xl border border-[#3E2A29]">
            <div className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider">Valid Reps</div>
            <div className="font-mono text-2xl font-bold text-[#F296A1] mt-1">
              {summary.totalValidReps}
              <span className="text-xs text-[#8C7473] font-normal"> / {summary.targetReps}</span>
            </div>
            <div className="text-[11px] text-[#A8908F] mt-0.5">Full lockouts</div>
          </div>

          <div className="bg-[#1A1010] p-4 rounded-2xl border border-[#3E2A29]">
            <div className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider">Incomplete Reps</div>
            <div className="font-mono text-2xl font-bold text-[#F7B4A2] mt-1">
              {summary.totalIncompleteReps}
            </div>
            <div className="text-[11px] text-[#A8908F] mt-0.5">Short depth</div>
          </div>

          <div className="bg-[#1A1010] p-4 rounded-2xl border border-[#3E2A29]">
            <div className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider">Form Accuracy</div>
            <div className="font-mono text-2xl font-bold text-[#B7D9BA] mt-1">
              {summary.averageFormScore}%
            </div>
            <div className="text-[11px] text-[#A8908F] mt-0.5">Kinematic score</div>
          </div>

          <div className="bg-[#1A1010] p-4 rounded-2xl border border-[#3E2A29]">
            <div className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider">Fatigue Drop</div>
            <div className="font-mono text-2xl font-bold text-[#FF8A80] mt-1 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              <span>{degradationPct}%</span>
            </div>
            <div className="text-[11px] text-[#A8908F] mt-0.5">Rep 1 vs final</div>
          </div>
        </div>

        {/* Rep-by-Rep Stability Degradation Chart */}
        <div className="bg-[#1A1010] p-5 rounded-2xl border border-[#3E2A29] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#F296A1]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F4DFDD]">
                Muscular Stability Degradation Curve
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#D8BDBB]">
              Fatigue Status: {degradationPct > 15 ? 'Fatigue Emergent' : 'Solid Motor Control'}
            </span>
          </div>

          {reps.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8C7473]">
              No completed repetitions registered in this set.
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <div className="flex items-end gap-2.5 h-32 px-2 border-b border-[#3E2A29] pb-2">
                {reps.map((r, i) => {
                  const barHeightPct = Math.max(15, r.formScore);
                  const isDegraded = r.formScore < 75;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                      <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-[#32201F] text-[10px] font-mono px-2 py-1 rounded-full border border-[#523837] pointer-events-none whitespace-nowrap z-20 text-[#FFD9DD]">
                        Rep {r.repNumber}: {r.formScore}% ({r.minAngle}°)
                      </div>
                      <div
                        style={{ height: `${barHeightPct}%` }}
                        className={`w-full max-w-[34px] rounded-t-lg transition-all ${
                          isDegraded
                            ? 'bg-gradient-to-t from-[#8C3A3A] to-[#FF8A80]'
                            : 'bg-gradient-to-t from-[#542A31] to-[#F296A1]'
                        }`}
                      />
                      <span className="text-[10px] font-mono text-[#8C7473] mt-1">R{r.repNumber}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-[#A8908F] font-mono px-1">
                <span>Start: Fresh Motor Control ({initialRepScore}%)</span>
                <span>Finish: Muscular Fatigue ({lastRepScore}%)</span>
              </div>
            </div>
          )}
        </div>

        {/* Common Biomechanical Mistakes Breakdown */}
        <div className="bg-[#1A1010] p-5 rounded-2xl border border-[#3E2A29] space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D8BDBB]">
            Biomechanic Flaw Breakdown
          </span>

          {summary.commonMistakes.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-[#B7D9BA] p-3 bg-[#243B23]/40 border border-[#3D633B] rounded-2xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Flawless set execution! Zero critical deviations detected.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {summary.commonMistakes.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#241716] border border-[#3E2A29] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FF8A80] shrink-0" />
                    <span className="text-[#F4DFDD]">{m.mistake}</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#481E1E] text-[#FFB4AB] border border-[#7C3636]">
                    {m.count} {m.count === 1 ? 'time' : 'times'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sync notification message */}
        {syncStatus && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
              syncStatus.success
                ? 'bg-[#253D24]/80 border border-[#426E40] text-[#CBECC8]'
                : 'bg-[#481E1E] border border-[#7C3636] text-[#FFB4AB]'
            }`}
          >
            {syncStatus.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#B7D9BA]" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF8A80]" />
            )}
            <span>{syncStatus.message}</span>
          </div>
        )}

        {/* Actions in Material You capsule styling */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportJson}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-[#32201F] hover:bg-[#442D2C] text-[#E8BAB8] text-xs font-semibold rounded-full border border-[#4E3534] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-[#542A31] hover:bg-[#6D343E] text-[#FFD9DD] text-xs font-semibold rounded-full border border-[#7A3B46] transition-all cursor-pointer disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5 text-[#F296A1]" />
              <span>{isSyncing ? 'Syncing...' : 'Sync to Django API'}</span>
            </button>
          </div>

          <button
            onClick={onStartNewSet}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#F296A1] hover:bg-[#F8AAB3] text-[#2D1418] text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-lg shadow-[#F296A1]/20"
          >
            <span>Start Next Set</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
