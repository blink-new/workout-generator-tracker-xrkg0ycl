export interface Exercise {
  id: string
  userId: string
  name: string
  muscleGroup: string
  weightType: 'bodyweight' | 'assisted' | 'additional'
  technique: string
  equipmentSetup?: string
  exerciseType: 'основное' | 'вспомогательное' | 'изолированное'
  equipmentName?: string
  equipmentPhoto?: string
  sets: number
  reps: number
  createdAt: string
  updatedAt: string
}

export interface Workout {
  id: string
  userId: string
  name: string
  muscleGroup: string
  status: 'planned' | 'active' | 'completed'
  createdAt: string
  startedAt?: string
  completedAt?: string
  totalTime: number
  totalWeight: number
}

export interface WorkoutExercise {
  id: string
  workoutId: string
  exerciseId: string
  sets: number
  reps: number
  weight: number
  completed: boolean
  order: number
  exercise?: Exercise
}

export interface WorkoutSet {
  id: string
  workoutExerciseId: string
  setNumber: number
  reps: number
  weight: number
  completed: boolean
}

export interface ExerciseProgress {
  id: string
  exerciseId: string
  userId: string
  lastWeight: number
  lastCompleted: number
  updatedAt: string
}

export const MUSCLE_GROUPS = [
  'Грудь',
  'Спина', 
  'Плечи',
  'Бицепс',
  'Трицепс',
  'Ноги',
  'Ягодицы',
  'Пресс',
  'Предплечья'
] as const

export const WEIGHT_TYPES = [
  { value: 'bodyweight', label: 'Свой вес' },
  { value: 'assisted', label: 'Антивес' },
  { value: 'additional', label: 'Доп. вес' }
] as const

export const EXERCISE_TYPES = [
  { value: 'основное', label: 'Основное' },
  { value: 'вспомогательное', label: 'Вспомогательное' },
  { value: 'изолированное', label: 'Изолированное' }
] as const