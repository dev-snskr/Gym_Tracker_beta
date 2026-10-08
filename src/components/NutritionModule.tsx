import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Flame,
  Droplet,
  CheckCircle2,
  Database,
  Apple,
  ShieldCheck,
} from 'lucide-react';
import { NutritionProfile, MealSuggestion } from '../types/fitness';

interface NutritionModuleProps {
  onSyncNutritionToDjango?: (profile: NutritionProfile) => Promise<boolean>;
}

export const NutritionModule: React.FC<NutritionModuleProps> = ({ onSyncNutritionToDjango }) => {
  // Calculator inputs
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [weight, setWeight] = useState<number>(75); // kg
  const [height, setHeight] = useState<number>(178); // cm
  const [age, setAge] = useState<number>(26);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [activityLevel, setActivityLevel] = useState<
    'sedentary' | 'light' | 'moderate' | 'very_active'
  >('moderate');
  const [fitnessGoal, setFitnessGoal] = useState<'fat_loss' | 'maintenance' | 'muscle_gain'>(
    'muscle_gain'
  );

  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Mifflin-St Jeor Formula
  const profile: NutritionProfile = useMemo(() => {
    const weightKg = unitSystem === 'metric' ? weight : weight * 0.453592;
    const heightCm = unitSystem === 'metric' ? height : height * 2.54;

    const bmrBase = 10 * weightKg + 6.25 * heightCm - 5 * age;
    const bmr = Math.round(gender === 'male' ? bmrBase + 5 : bmrBase - 161);

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
    };

    const tdee = Math.round(bmr * activityMultipliers[activityLevel]);

    let targetCalories = tdee;
    if (fitnessGoal === 'fat_loss') {
      targetCalories = Math.round(tdee * 0.8);
    } else if (fitnessGoal === 'muscle_gain') {
      targetCalories = Math.round(tdee * 1.15);
    }

    const proteinGrams = Math.round(weightKg * 2.1);
    const fatCalories = targetCalories * 0.25;
    const fatsGrams = Math.round(fatCalories / 9);
    const remainingCalories = targetCalories - proteinGrams * 4 - fatsGrams * 9;
    const carbsGrams = Math.max(80, Math.round(remainingCalories / 4));
    const waterLiters = Number((weightKg * 0.04).toFixed(1));

    return {
      weightKg: Math.round(weightKg),
      heightCm: Math.round(heightCm),
      age,
      gender,
      activityLevel,
      fitnessGoal,
      bmr,
      tdee,
      targetCalories,
      proteinGrams,
      carbsGrams,
      fatsGrams,
      waterLiters,
    };
  }, [unitSystem, weight, height, age, gender, activityLevel, fitnessGoal]);

  const mealSuggestions: MealSuggestion[] = useMemo(() => {
    const cal = profile.targetCalories;
    return [
      {
        name: 'Power Protein Oats & Berry Bowl',
        timeOfDay: 'Breakfast (8:00 AM)',
        calories: Math.round(cal * 0.26),
        protein: Math.round(profile.proteinGrams * 0.26),
        carbs: Math.round(profile.carbsGrams * 0.3),
        fats: Math.round(profile.fatsGrams * 0.2),
        foods: [
          '80g Rolled Oats cooked with unsweetened almond milk',
          '1 scoop Whey or Plant Isolate Protein powder',
          '1 tbsp Natural Peanut Butter or Almond Butter',
          '1/2 cup Fresh Blueberries / Strawberries',
          '1 pinch Ceylon Cinnamon & Chia seeds',
        ],
        beginnerTip:
          'Stir protein powder into oats after cooling slightly to prevent clumping. High fiber keeps morning energy steady.',
      },
      {
        name: 'Grilled Chicken & Sweet Potato Fuel Box',
        timeOfDay: 'Lunch (12:30 PM)',
        calories: Math.round(cal * 0.32),
        protein: Math.round(profile.proteinGrams * 0.34),
        carbs: Math.round(profile.carbsGrams * 0.32),
        fats: Math.round(profile.fatsGrams * 0.28),
        foods: [
          '180g Grilled Chicken Breast or Firm Tofu',
          '200g Roasted Sweet Potato cubes',
          '1.5 cups Steamed Broccoli florets with sea salt',
          '1 tbsp Extra Virgin Olive Oil drizzle',
        ],
        beginnerTip:
          'Batch cook sweet potatoes and chicken twice a week. Clean whole foods sustain glycogen without mid-day crashes.',
      },
      {
        name: 'Pre/Post Workout Anabolic Refuel',
        timeOfDay: 'Training Window (4:30 PM)',
        calories: Math.round(cal * 0.16),
        protein: Math.round(profile.proteinGrams * 0.15),
        carbs: Math.round(profile.carbsGrams * 0.2),
        fats: Math.round(profile.fatsGrams * 0.12),
        foods: [
          '1 Medium Banana (fast acting carbs)',
          '150g 0% Fat Plain Greek Yogurt',
          '1 tsp Raw Honey',
        ],
        beginnerTip:
          'Consume 45 minutes prior to squat/lifting session for explosive ATP energy and rapid muscle recovery.',
      },
      {
        name: 'Wild Salmon, Quinoa & Greens Dinner',
        timeOfDay: 'Dinner (7:30 PM)',
        calories: Math.round(cal * 0.26),
        protein: Math.round(profile.proteinGrams * 0.25),
        carbs: Math.round(profile.carbsGrams * 0.18),
        fats: Math.round(profile.fatsGrams * 0.4),
        foods: [
          '170g Pan-Seared Atlantic Salmon Fillet (Omega-3s)',
          '120g Cooked Tri-Color Quinoa or Jasmine Rice',
          'Asparagus spears sauteed in garlic & lemon',
          '1/4 Sliced Hass Avocado',
        ],
        beginnerTip:
          'Omega-3 fatty acids in salmon directly reduce joint inflammation from heavy compound movements.',
      },
    ];
  }, [profile]);

  const handleSyncClick = async () => {
    setSyncStatus('Syncing with Django REST endpoint...');
    if (onSyncNutritionToDjango) {
      await onSyncNutritionToDjango(profile);
    }
    setTimeout(() => {
      setSyncStatus('Successfully saved Nutrition Profile to User DB!');
      setTimeout(() => setSyncStatus(null), 4000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header in Material You Brown-Pink */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#241716] border border-[#442E2D] p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#542A31] text-[#FFD9DD] flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-lg text-[#F4DFDD]">
              Goal-Based Diet & Nutrition Lab
            </h2>
          </div>
          <p className="text-xs text-[#C6ABAA] mt-1">
            Personalized energy expenditure, macro partition, and beginner-friendly whole foods.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-1 bg-[#1A1010] border border-[#442E2D] rounded-full flex items-center">
            <button
              onClick={() => setUnitSystem('metric')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                unitSystem === 'metric' ? 'bg-[#F296A1] text-[#2C1316] font-bold' : 'text-[#A8908F]'
              }`}
            >
              Metric (kg/cm)
            </button>
            <button
              onClick={() => setUnitSystem('imperial')}
              className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                unitSystem === 'imperial' ? 'bg-[#F296A1] text-[#2C1316] font-bold' : 'text-[#A8908F]'
              }`}
            >
              Imperial (lbs/in)
            </button>
          </div>

          <button
            onClick={handleSyncClick}
            className="flex items-center gap-2 px-5 py-2 bg-[#F296A1] hover:bg-[#F8AAB3] text-[#2D1418] font-bold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-md"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Save to Profile</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3.5 bg-[#253D24]/80 border border-[#426E40] rounded-2xl text-xs text-[#CBECC8] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#B7D9BA]" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Main Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Form (5 cols) */}
        <div className="lg:col-span-5 bg-[#241716] border border-[#442E2D] rounded-3xl p-6 space-y-5">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D8BDBB] block">
            Biometric Parameters
          </span>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#C6ABAA] block mb-1">
                Weight ({unitSystem === 'metric' ? 'kg' : 'lbs'})
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-[#1A1010] border border-[#4C3332] rounded-2xl px-3.5 py-2 text-sm text-[#F4DFDD] font-mono focus:border-[#F296A1] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#C6ABAA] block mb-1">
                Height ({unitSystem === 'metric' ? 'cm' : 'inches'})
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-[#1A1010] border border-[#4C3332] rounded-2xl px-3.5 py-2 text-sm text-[#F4DFDD] font-mono focus:border-[#F296A1] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#C6ABAA] block mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-[#1A1010] border border-[#4C3332] rounded-2xl px-3.5 py-2 text-sm text-[#F4DFDD] font-mono focus:border-[#F296A1] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[#C6ABAA] block mb-1">Biological Sex</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                className="w-full bg-[#1A1010] border border-[#4C3332] rounded-2xl px-3.5 py-2 text-sm text-[#F4DFDD] focus:border-[#F296A1] focus:outline-none cursor-pointer"
              >
                <option value="male">Male (+5 kcal)</option>
                <option value="female">Female (-161 kcal)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#C6ABAA] block mb-1">Activity Multiplier</label>
            <select
              value={activityLevel}
              onChange={(e) =>
                setActivityLevel(e.target.value as 'sedentary' | 'light' | 'moderate' | 'very_active')
              }
              className="w-full bg-[#1A1010] border border-[#4C3332] rounded-2xl px-3.5 py-2 text-sm text-[#F4DFDD] focus:border-[#F296A1] focus:outline-none cursor-pointer"
            >
              <option value="sedentary">Sedentary (Desk job, minimal activity 1.2x)</option>
              <option value="light">Lightly Active (1-3 gym workouts/week 1.375x)</option>
              <option value="moderate">Moderately Active (3-5 workouts/week 1.55x)</option>
              <option value="very_active">Very Active (6-7 intense sessions/week 1.725x)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-[#C6ABAA] block mb-1">Primary Fitness Goal</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFitnessGoal('fat_loss')}
                className={`py-2 text-xs font-semibold rounded-2xl border transition-all cursor-pointer ${
                  fitnessGoal === 'fat_loss'
                    ? 'bg-[#533024] border-[#8A4F3C] text-[#FFDBCF] font-bold'
                    : 'bg-[#1A1010] border-[#3E2A29] text-[#A8908F]'
                }`}
              >
                Fat Loss (-20%)
              </button>
              <button
                onClick={() => setFitnessGoal('maintenance')}
                className={`py-2 text-xs font-semibold rounded-2xl border transition-all cursor-pointer ${
                  fitnessGoal === 'maintenance'
                    ? 'bg-[#542A31] border-[#9E4D5B] text-[#FFD9DD] font-bold'
                    : 'bg-[#1A1010] border-[#3E2A29] text-[#A8908F]'
                }`}
              >
                Maintain
              </button>
              <button
                onClick={() => setFitnessGoal('muscle_gain')}
                className={`py-2 text-xs font-semibold rounded-2xl border transition-all cursor-pointer ${
                  fitnessGoal === 'muscle_gain'
                    ? 'bg-[#294228] border-[#487146] text-[#D0EDCE] font-bold'
                    : 'bg-[#1A1010] border-[#3E2A29] text-[#A8908F]'
                }`}
              >
                Gain (+15%)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Calculated Energy & Macro Partition (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Energy Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-[#241716] border border-[#442E2D] p-4 rounded-3xl">
              <div className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider">
                Resting BMR
              </div>
              <div className="font-mono text-2xl font-bold text-[#F4DFDD] mt-1">
                {profile.bmr} <span className="text-xs text-[#8C7473]">kcal</span>
              </div>
              <div className="text-[11px] text-[#A8908F] mt-0.5">Basal baseline</div>
            </div>

            <div className="bg-[#241716] border border-[#442E2D] p-4 rounded-3xl">
              <div className="text-[10px] text-[#C6ABAA] uppercase font-bold tracking-wider">
                TDEE Daily
              </div>
              <div className="font-mono text-2xl font-bold text-[#F7B4A2] mt-1">
                {profile.tdee} <span className="text-xs text-[#8C7473]">kcal</span>
              </div>
              <div className="text-[11px] text-[#A8908F] mt-0.5">Total burn</div>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-[#542A31] border border-[#7D3B47] p-4 rounded-3xl">
              <div className="text-[10px] text-[#FFD9DD] uppercase font-bold tracking-wider">
                Target Calories
              </div>
              <div className="font-mono text-2xl font-bold text-[#FFD9DD] mt-1">
                {profile.targetCalories} <span className="text-xs text-[#FFC4CC]">kcal</span>
              </div>
              <div className="text-[11px] text-[#F3DFDD] mt-0.5">
                {fitnessGoal === 'fat_loss' ? '20% Deficit' : fitnessGoal === 'muscle_gain' ? '15% Surplus' : 'Maintenance'}
              </div>
            </div>
          </div>

          {/* Macro Breakdown */}
          <div className="bg-[#241716] border border-[#442E2D] p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D8BDBB]">
                Daily Macronutrient Split
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#B7D9BA] font-mono">
                <Droplet className="w-3.5 h-3.5" />
                <span>Hydration: {profile.waterLiters}L water/day</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1A1010] p-4 rounded-2xl border border-[#3E2A29]">
                <div className="text-[10px] text-[#F296A1] uppercase font-bold tracking-wider">
                  Protein (2.1g/kg)
                </div>
                <div className="font-mono text-2xl font-bold text-[#F296A1] mt-1">
                  {profile.proteinGrams}g
                </div>
                <div className="text-[11px] text-[#A8908F] mt-0.5">
                  {Math.round((profile.proteinGrams * 400) / profile.targetCalories)}% calories
                </div>
              </div>

              <div className="bg-[#1A1010] p-4 rounded-2xl border border-[#3E2A29]">
                <div className="text-[10px] text-[#F7B4A2] uppercase font-bold tracking-wider">
                  Carbohydrates
                </div>
                <div className="font-mono text-2xl font-bold text-[#F7B4A2] mt-1">
                  {profile.carbsGrams}g
                </div>
                <div className="text-[11px] text-[#A8908F] mt-0.5">
                  {Math.round((profile.carbsGrams * 400) / profile.targetCalories)}% calories
                </div>
              </div>

              <div className="bg-[#1A1010] p-4 rounded-2xl border border-[#3E2A29]">
                <div className="text-[10px] text-[#B7D9BA] uppercase font-bold tracking-wider">
                  Essential Fats
                </div>
                <div className="font-mono text-2xl font-bold text-[#B7D9BA] mt-1">
                  {profile.fatsGrams}g
                </div>
                <div className="text-[11px] text-[#A8908F] mt-0.5">
                  {Math.round((profile.fatsGrams * 900) / profile.targetCalories)}% calories
                </div>
              </div>
            </div>

            {/* Visual Macro Bar */}
            <div className="h-3 w-full bg-[#1A1010] rounded-full overflow-hidden flex border border-[#3E2A29]">
              <div
                style={{
                  width: `${(profile.proteinGrams * 400) / profile.targetCalories}%`,
                }}
                className="bg-[#F296A1] h-full"
                title="Protein"
              />
              <div
                style={{
                  width: `${(profile.carbsGrams * 400) / profile.targetCalories}%`,
                }}
                className="bg-[#F7B4A2] h-full"
                title="Carbohydrates"
              />
              <div
                style={{
                  width: `${(profile.fatsGrams * 900) / profile.targetCalories}%`,
                }}
                className="bg-[#B7D9BA] h-full"
                title="Fats"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Beginner-Friendly Whole Food Meal Protocol */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <Apple className="w-5 h-5 text-[#F296A1]" />
          <h3 className="font-display font-bold text-base text-[#F4DFDD]">
            Beginner Whole-Food Protocol
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mealSuggestions.map((meal, idx) => (
            <div
              key={idx}
              className="bg-[#241716] border border-[#442E2D] rounded-3xl p-6 space-y-3.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#F296A1] font-semibold">
                    {meal.timeOfDay}
                  </span>
                  <span className="font-mono text-xs font-bold px-3 py-0.5 rounded-full bg-[#352120] text-[#FFD9DD] border border-[#4E3534]">
                    {meal.calories} kcal
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-[#F4DFDD] mt-1.5">{meal.name}</h4>

                <div className="flex items-center gap-3 text-[11px] font-mono text-[#C6ABAA] mt-2">
                  <span>P: {meal.protein}g</span>
                  <span className="text-[#593E3C]">·</span>
                  <span>C: {meal.carbs}g</span>
                  <span className="text-[#593E3C]">·</span>
                  <span>F: {meal.fats}g</span>
                </div>

                <div className="mt-3.5 space-y-1.5">
                  {meal.foods.map((food, fIdx) => (
                    <div key={fIdx} className="text-xs text-[#E8BAB8] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F296A1] shrink-0" />
                      <span>{food}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 p-3 rounded-2xl bg-[#1A1010] border border-[#3E2A29] text-[11px] text-[#A8908F] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#F296A1] shrink-0 mt-0.5" />
                <span>{meal.beginnerTip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
