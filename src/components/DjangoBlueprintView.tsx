import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  Code2,
  Terminal,
  Send,
  Layers,
  FileCode2,
  Server,
  Zap,
} from 'lucide-react';
import { WorkoutSessionSummary } from '../types/fitness';

interface DjangoBlueprintViewProps {
  currentSession: WorkoutSessionSummary | null;
}

export const DjangoBlueprintView: React.FC<DjangoBlueprintViewProps> = ({ currentSession }) => {
  const [activeFile, setActiveFile] = useState<'models' | 'serializers' | 'views' | 'urls'>('models');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testPayloadResult, setTestPayloadResult] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const djangoCode = {
    models: `"""
Gym Form AI - Django Database Models
gym_form_app/models.py
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class UserFitnessProfile(models.Model):
    EXERCISE_GOALS = [
        ('strength', 'Strength & Power'),
        ('hypertrophy', 'Hypertrophy & Muscle Gain'),
        ('form_mastery', 'Biomechanics & Form Mastery'),
    ]
    
    ACTIVITY_LEVELS = [
        ('sedentary', 'Sedentary'),
        ('light', 'Lightly Active'),
        ('moderate', 'Moderately Active'),
        ('very_active', 'Very Active'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='fitness_profile')
    weight_kg = models.FloatField(validators=[MinValueValidator(30.0), MaxValueValidator(300.0)])
    height_cm = models.FloatField(validators=[MinValueValidator(100.0), MaxValueValidator(250.0)])
    age = models.PositiveIntegerField(validators=[MinValueValidator(12), MaxValueValidator(100)])
    biological_sex = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female')])
    activity_level = models.CharField(max_length=20, choices=ACTIVITY_LEVELS, default='moderate')
    primary_goal = models.CharField(max_length=20, choices=EXERCISE_GOALS, default='hypertrophy')
    
    # Calculated metabolic stats
    bmr_calories = models.PositiveIntegerField(default=1600)
    tdee_calories = models.PositiveIntegerField(default=2200)
    target_daily_calories = models.PositiveIntegerField(default=2200)
    target_protein_grams = models.PositiveIntegerField(default=150)
    target_carbs_grams = models.PositiveIntegerField(default=250)
    target_fats_grams = models.PositiveIntegerField(default=65)
    target_water_liters = models.FloatField(default=3.0)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.primary_goal}"


class WorkoutSession(models.Model):
    EXERCISES = [
        ('squat', 'Barbell / Air Squat'),
        ('pushup', 'Push-Up'),
        ('bicep_curl', 'Bicep Curl'),
        ('lunge', 'Lunge'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workout_sessions')
    exercise = models.CharField(max_length=30, choices=EXERCISES)
    goal = models.CharField(max_length=30)
    target_reps = models.PositiveIntegerField(default=10)
    valid_reps = models.PositiveIntegerField(default=0)
    incomplete_reps = models.PositiveIntegerField(default=0)
    average_form_score = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Kinematic posture accuracy score %"
    )
    fatigue_index = models.FloatField(
        default=0.0,
        help_text="Measured degradation in form from rep 1 to final rep %"
    )
    duration_seconds = models.PositiveIntegerField(default=0)
    raw_telemetry_meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.exercise} ({self.valid_reps} reps) on {self.created_at:%Y-%m-%d}"


class RepetitionTelemetry(models.Model):
    session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name='repetitions')
    rep_number = models.PositiveIntegerField()
    duration_ms = models.PositiveIntegerField()
    min_angle = models.FloatField(help_text="Deepest joint angle reached")
    max_angle = models.FloatField(help_text="Peak lockout angle")
    form_score = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    is_valid = models.BooleanField(default=True)
    inflection_depth_met = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['session', 'rep_number']

    def __str__(self):
        return f"Rep #{self.rep_number} (Score: {self.form_score}%)"


class BiomechanicalDeviation(models.Model):
    SEVERITY_LEVELS = [
        ('warning', 'Form Warning'),
        ('critical', 'Injury Risk / Critical'),
    ]

    repetition = models.ForeignKey(RepetitionTelemetry, on_delete=models.CASCADE, related_name='deviations')
    deviation_id = models.CharField(max_length=60)
    message = models.CharField(max_length=255)
    joint_affected = models.CharField(max_length=100)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='warning')
    recommended_correction = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.message} on {self.joint_affected}"
`,

    serializers: `"""
Gym Form AI - Django REST Framework Serializers
gym_form_app/serializers.py
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserFitnessProfile,
    WorkoutSession,
    RepetitionTelemetry,
    BiomechanicalDeviation,
)

class BiomechanicalDeviationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BiomechanicalDeviation
        fields = ['id', 'deviation_id', 'message', 'joint_affected', 'severity', 'recommended_correction']


class RepetitionTelemetrySerializer(serializers.ModelSerializer):
    deviations = BiomechanicalDeviationSerializer(many=True, required=False)

    class Meta:
        model = RepetitionTelemetry
        fields = [
            'id', 'rep_number', 'duration_ms', 'min_angle', 'max_angle',
            'form_score', 'is_valid', 'inflection_depth_met', 'deviations'
        ]

    def create(self, validated_data):
        deviations_data = validated_data.pop('deviations', [])
        rep = RepetitionTelemetry.objects.create(**validated_data)
        for dev_data in deviations_data:
            BiomechanicalDeviation.objects.create(repetition=rep, **dev_data)
        return rep


class WorkoutSessionSerializer(serializers.ModelSerializer):
    repetitions = RepetitionTelemetrySerializer(many=True, required=False)
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = WorkoutSession
        fields = [
            'id', 'username', 'exercise', 'goal', 'target_reps', 'valid_reps',
            'incomplete_reps', 'average_form_score', 'fatigue_index',
            'duration_seconds', 'repetitions', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        repetitions_data = validated_data.pop('repetitions', [])
        # Assign current authenticated user if not explicitly passed
        user = self.context['request'].user if 'request' in self.context else User.objects.first()
        session = WorkoutSession.objects.create(user=user, **validated_data)

        for rep_data in repetitions_data:
            deviations_data = rep_data.pop('deviations', [])
            rep = RepetitionTelemetry.objects.create(session=session, **rep_data)
            for dev_data in deviations_data:
                BiomechanicalDeviation.objects.create(repetition=rep, **dev_data)

        return session


class UserFitnessProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = UserFitnessProfile
        fields = '__all__'
        read_only_fields = ['user', 'updated_at']
`,

    views: `"""
Gym Form AI - Django REST Framework Views
gym_form_app/views.py
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg, Count
from .models import WorkoutSession, RepetitionTelemetry, UserFitnessProfile
from .serializers import (
    WorkoutSessionSerializer,
    RepetitionTelemetrySerializer,
    UserFitnessProfileSerializer,
)

class WorkoutSessionViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for gym workout sessions and computer vision rep telemetry
    """
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return WorkoutSession.objects.filter(user=user).prefetch_related('repetitions__deviations')
        return WorkoutSession.objects.all().prefetch_related('repetitions__deviations')

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    @action(detail=False, methods=['get'])
    def aggregate_fatigue_summary(self, request):
        """
        Computes user fatigue trends across exercises over time
        """
        qs = self.get_queryset()
        summary = qs.values('exercise').annotate(
            total_sets=Count('id'),
            avg_score=Avg('average_form_score'),
            avg_fatigue_drop=Avg('fatigue_index'),
        )
        return Response({
            'status': 'success',
            'analytics': summary,
            'total_recorded_sessions': qs.count()
        })


class UserFitnessProfileView(APIView):
    """
    Manages user biometric nutrition profile and TDEE calculations
    """
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        profile = UserFitnessProfile.objects.filter(user=request.user).first()
        if not profile:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserFitnessProfileSerializer(profile).data)

    def post(self, request):
        profile, created = UserFitnessProfile.objects.get_or_create(user=request.user)
        serializer = UserFitnessProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
`,

    urls: `"""
Gym Form AI - Django URL Configuration
gym_form_app/urls.py
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkoutSessionViewSet, UserFitnessProfileView

router = DefaultRouter()
router.register(r'sessions', WorkoutSessionViewSet, basename='workout-session')

urlpatterns = [
    # REST API endpoints
    path('api/v1/', include(router.urls)),
    path('api/v1/nutrition/profile/', UserFitnessProfileView.as_view(), name='nutrition-profile'),
]
`,
  };

  const handleRunMockAPITest = () => {
    setIsSendingTest(true);
    setTimeout(() => {
      const mockSavedId = Math.floor(1000 + Math.random() * 9000);
      const res = {
        status: 201,
        message: 'HTTP/1.1 201 Created',
        endpoint: 'POST /api/v1/sessions/',
        savedRecord: {
          id: mockSavedId,
          exercise: currentSession ? currentSession.exercise : 'squat',
          goal: currentSession ? currentSession.goal : 'hypertrophy',
          target_reps: currentSession ? currentSession.targetReps : 10,
          valid_reps: currentSession ? currentSession.totalValidReps : 8,
          incomplete_reps: currentSession ? currentSession.totalIncompleteReps : 1,
          average_form_score: currentSession ? currentSession.averageFormScore : 92.4,
          fatigue_index: currentSession ? currentSession.fatigueIndex : 8.5,
          repetitions_logged: currentSession ? currentSession.repetitions.length : 8,
          created_at: new Date().toISOString(),
          database_table: 'gym_form_app_workoutsession',
        },
      };
      setTestPayloadResult(JSON.stringify(res, null, 2));
      setIsSendingTest(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Blueprint Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#241716] border border-[#442E2D] p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#542A31] text-[#FFD9DD] flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-lg text-[#F4DFDD]">
              Python Django REST API Blueprint
            </h2>
          </div>
          <p className="text-xs text-[#C6ABAA] mt-1">
            Production backend architecture for persisting computer vision session telemetry, rep kinematics, and nutritional logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunMockAPITest}
            disabled={isSendingTest}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#F296A1] hover:bg-[#F8AAB3] text-[#2D1418] font-bold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingTest ? 'Sending...' : 'Test Mock API Dispatch'}</span>
          </button>
        </div>
      </div>

      {/* Code Tabs */}
      <div className="bg-[#241716] border border-[#442E2D] rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#3E2A29] px-4 py-2.5 bg-[#1A1010]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveFile('models')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                activeFile === 'models'
                  ? 'bg-[#542A31] text-[#FFD9DD] border border-[#7D3B47]'
                  : 'text-[#A8908F] hover:text-white'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>models.py</span>
            </button>

            <button
              onClick={() => setActiveFile('serializers')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                activeFile === 'serializers'
                  ? 'bg-[#542A31] text-[#FFD9DD] border border-[#7D3B47]'
                  : 'text-[#A8908F] hover:text-white'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>serializers.py</span>
            </button>

            <button
              onClick={() => setActiveFile('views')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                activeFile === 'views'
                  ? 'bg-[#542A31] text-[#FFD9DD] border border-[#7D3B47]'
                  : 'text-[#A8908F] hover:text-white'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>views.py</span>
            </button>

            <button
              onClick={() => setActiveFile('urls')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                activeFile === 'urls'
                  ? 'bg-[#542A31] text-[#FFD9DD] border border-[#7D3B47]'
                  : 'text-[#A8908F] hover:text-white'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>urls.py</span>
            </button>
          </div>

          <button
            onClick={() => copyToClipboard(djangoCode[activeFile], activeFile)}
            className="flex items-center gap-1.5 px-3.5 py-1 text-xs text-[#E8BAB8] hover:text-white bg-[#352120] hover:bg-[#482D2B] rounded-full border border-[#4E3534] transition-all cursor-pointer"
          >
            {copiedKey === activeFile ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#B7D9BA]" />
                <span className="text-[#B7D9BA]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Viewport */}
        <div className="p-4 bg-[#140C0C] font-mono text-xs overflow-x-auto text-[#E8BAB8] max-h-[500px] leading-relaxed">
          <pre>{djangoCode[activeFile]}</pre>
        </div>
      </div>

      {/* Live Mock API Payload & Response Inspector */}
      {testPayloadResult && (
        <div className="bg-[#241716] border border-[#442E2D] rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#F296A1]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#D8BDBB]">
                Django REST Framework Response (Simulator)
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#B7D9BA] bg-[#223921] px-2.5 py-0.5 rounded-full border border-[#3E653C]">
              201 CREATED
            </span>
          </div>

          <pre className="p-4 bg-[#140C0C] rounded-2xl text-xs font-mono text-[#FFD9DD] border border-[#3E2A29] overflow-x-auto">
            {testPayloadResult}
          </pre>
        </div>
      )}
    </div>
  );
};
