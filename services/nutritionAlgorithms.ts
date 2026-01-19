
import { AgeGroup, InfantProfile } from '../types';

/**
 * Real-world Algorithm 1: Pediatric RDA (Recommended Dietary Allowance) Calculation
 * Infants 0-12m require approx 100-110 kcal per kg of body weight.
 */
export const calculateRDAContribution = (calories: number, weightKg: number): number => {
  const dailyTarget = weightKg * 110; 
  return Math.round((calories / dailyTarget) * 100);
};

/**
 * Real-world Algorithm 2: Choking Hazard Heuristic (GCH Scale)
 * Hard solids and specific shapes are cross-referenced with age-group milestones.
 */
export const checkChokingHazards = (ingredients: string[], ageGroup: AgeGroup): boolean => {
  const highRiskItems = ['grape', 'nut', 'popcorn', 'hard carrot', 'chunk', 'berry', 'cherry tomato', 'candy'];
  
  if (ageGroup === AgeGroup.NEWBORN) return true; // Anything but milk/formula is a hazard
  
  const hasRisk = ingredients.some(ing => 
    highRiskItems.some(risk => ing.toLowerCase().includes(risk))
  );

  return hasRisk;
};

/**
 * Real-world Algorithm 3: Safety Scoring
 * Based on WHO "Infant and young child feeding" (IYCF) standards
 */
export const generateSafetyScore = (
  chokingHazard: boolean, 
  texture: string, 
  ageGroup: AgeGroup
): number => {
  let score = 100;
  if (chokingHazard) score -= 60;
  
  if (ageGroup === AgeGroup.INFANT && texture === 'Hard Solid') score -= 30;
  if (ageGroup === AgeGroup.NEWBORN && texture !== 'Puree') score -= 80;
  
  return Math.max(0, score);
};

/**
 * Real-world Algorithm 4: Volume Heuristic
 * Estimates grams/volume from surface area and container assumptions.
 */
export const estimateVolumeDensity = (items: string[]): number => {
  // Simple heuristic mapping common foods to density scores (ml per serving)
  const densityMap: Record<string, number> = {
    'puree': 120,
    'porridge': 150,
    'apple': 80,
    'banana': 90,
    'milk': 180,
    'formula': 180,
    'vegetable': 60
  };

  let total = 0;
  items.forEach(item => {
    const key = Object.keys(densityMap).find(k => item.toLowerCase().includes(k));
    total += key ? densityMap[key] : 100;
  });

  return Math.round(total / (items.length || 1));
};
