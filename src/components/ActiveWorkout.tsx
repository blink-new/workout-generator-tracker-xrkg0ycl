import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Progress } from './ui/progress'
import { Play, Timer, Check, X, Plus, Minus, RotateCcw, Dumbbell, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { blink } from '../blink/client'
import Timer from './Timer'
import type { Workout, WorkoutExercise, Exercise, WorkoutSet } from '../types'

export default function ActiveWorkout() {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null)
  const [workoutExercises, setWorkoutExercises] = useState<(WorkoutExercise & { exercise: Exercise })[]>([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const [showWeightDialog, setShowWeightDialog] = useState(false)
  const [tempWeight, setTempWeight] = useState(0)
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null)
  const [workoutTime, setWorkoutTime] = useState(0)
  const [showTimer, setShowTimer] = useState(false)
  const [showReplaceDialog, setShowReplaceDialog] = useState(false)
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])

  const loadSetsForExercise = async (workoutExerciseId: string) => {
    try {
      const sets = await blink.db.workoutSets.list({
        where: { workoutExerciseId },
        orderBy: { setNumber: 'asc' }
      })
      setSets(sets)
    } catch (error) {
      console.error('Ошибка загрузки подходов:', error)
    }
  }

  const loadActiveWorkout = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const workouts = await blink.db.workouts.list({
        where: { userId: user.id, status: 'active' },
        limit: 1
      })

      if (workouts.length > 0) {
        const workout = workouts[0]
        setActiveWorkout(workout)
        
        if (workout.startedAt) {
          setWorkoutStartTime(new Date(workout.startedAt))
        }

        // Загружаем упражнения тренировки
        const exercises = await blink.db.workoutExercises.list({
          where: { workoutId: workout.id },
          orderBy: { order: 'asc' }
        })

        // Загружаем детали упражнений
        const exercisesWithDetails = await Promise.all(
          exercises.map(async (we) => {
            const exerciseList = await blink.db.exercises.list({
              where: { id: we.exerciseId },
              limit: 1
            })
            return {
              ...we,
              exercise: exerciseList[0]
            }
          })
        )

        setWorkoutExercises(exercisesWithDetails)

        // Загружаем подходы для текущего упражнения
        if (exercisesWithDetails.length > 0) {
          loadSetsForExercise(exercisesWithDetails[0].id)
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки активной тренировки:', error)
    }
  }, [])

  useEffect(() => {
    loadActiveWorkout()
  }, [loadActiveWorkout])

  useEffect(() => {
    // Обновляем время тренировки каждую секунду
    let interval: NodeJS.Timeout | null = null
    if (workoutStartTime && activeWorkout?.status === 'active') {
      interval = setInterval(() => {
        setWorkoutTime(Math.floor((Date.now() - workoutStartTime.getTime()) / 1000))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [workoutStartTime, activeWorkout?.status])

  const startWorkout = async (workoutId: string) => {
    try {
      const startTime = new Date().toISOString()
      await blink.db.workouts.update(workoutId, {
        status: 'active',
        startedAt: startTime
      })
      
      setWorkoutStartTime(new Date(startTime))
      loadActiveWorkout()
      toast.success('Тренировка начата!')
    } catch (error) {
      console.error('Ошибка начала тренировки:', error)
      toast.error('Ошибка начала тренировки')
    }
  }

  const addSet = async () => {
    if (!workoutExercises[currentExerciseIndex]) return

    const currentExercise = workoutExercises[currentExerciseIndex]
    const setNumber = sets.length + 1

    try {
      const newSet = await blink.db.workoutSets.create({
        id: `set_${Date.now()}_${setNumber}`,
        workoutExerciseId: currentExercise.id,
        setNumber,
        reps: currentExercise.reps,
        weight: tempWeight || 0,
        completed: false
      })

      setSets([...sets, newSet])
      setTempWeight(tempWeight || 0)
    } catch (error) {
      console.error('Ошибка добавления подхода:', error)
      toast.error('Ошибка добавления подхода')
    }
  }

  const toggleSetCompletion = async (setId: string, completed: boolean) => {
    try {
      await blink.db.workoutSets.update(setId, { completed })
      setSets(sets.map(set => 
        set.id === setId ? { ...set, completed } : set
      ))
      
      if (completed) {
        toast.success('Подход выполнен!')
      }
    } catch (error) {
      console.error('Ошибка обновления подхода:', error)
      toast.error('Ошибка обновления подхода')
    }
  }

  const updateSetWeight = async (setId: string, weight: number) => {
    try {
      await blink.db.workoutSets.update(setId, { weight })
      setSets(sets.map(set => 
        set.id === setId ? { ...set, weight } : set
      ))
    } catch (error) {
      console.error('Ошибка обновления веса:', error)
      toast.error('Ошибка обновления веса')
    }
  }

  const updateSetReps = async (setId: string, reps: number) => {
    try {
      await blink.db.workoutSets.update(setId, { reps })
      setSets(sets.map(set => 
        set.id === setId ? { ...set, reps } : set
      ))
    } catch (error) {
      console.error('Ошибка обновления повторений:', error)
      toast.error('Ошибка обновления повторений')
    }
  }

  const nextExercise = () => {
    if (currentExerciseIndex < workoutExercises.length - 1) {
      const nextIndex = currentExerciseIndex + 1
      setCurrentExerciseIndex(nextIndex)
      loadSetsForExercise(workoutExercises[nextIndex].id)
      setTempWeight(0)
    }
  }

  const prevExercise = () => {
    if (currentExerciseIndex > 0) {
      const prevIndex = currentExerciseIndex - 1
      setCurrentExerciseIndex(prevIndex)
      loadSetsForExercise(workoutExercises[prevIndex].id)
      setTempWeight(0)
    }
  }

  const completeWorkout = async () => {
    if (!activeWorkout) return

    try {
      const completedAt = new Date().toISOString()
      const totalTime = workoutTime
      
      // Подсчитываем общий поднятый вес
      let totalWeight = 0
      for (const exercise of workoutExercises) {
        const exerciseSets = await blink.db.workoutSets.list({
          where: { workoutExerciseId: exercise.id, completed: true }
        })
        
        for (const set of exerciseSets) {
          let setWeight = set.weight * set.reps
          
          // Учитываем тип веса
          if (exercise.exercise.weightType === 'bodyweight') {
            setWeight += 70 * set.reps // Предполагаем вес тела 70кг
          } else if (exercise.exercise.weightType === 'assisted') {
            setWeight = Math.max(0, 70 - set.weight) * set.reps
          }
          
          totalWeight += setWeight
        }
      }

      await blink.db.workouts.update(activeWorkout.id, {
        status: 'completed',
        completedAt,
        totalTime,
        totalWeight
      })

      setActiveWorkout(null)
      setWorkoutExercises([])
      setSets([])
      setCurrentExerciseIndex(0)
      setWorkoutStartTime(null)
      setWorkoutTime(0)
      
      toast.success(`Тренировка завершена! Время: ${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}, Вес: ${totalWeight}кг`)
    } catch (error) {
      console.error('Ошибка завершения тренировки:', error)
      toast.error('Ошибка завершения тренировки')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentExercise = workoutExercises[currentExerciseIndex]
  const completedSets = sets.filter(set => set.completed).length
  const progress = workoutExercises.length > 0 ? ((currentExerciseIndex + (completedSets / (currentExercise?.sets || 1))) / workoutExercises.length) * 100 : 0

  const openReplaceDialog = async () => {
    if (!currentExercise) return

    try {
      const user = await blink.auth.me()
      // Загружаем все упражнения той же группы мышц и типа, исключая текущее
      const exercises = await blink.db.exercises.list({
        where: { 
          userId: user.id,
          muscleGroup: currentExercise.exercise.muscleGroup,
          exerciseType: currentExercise.exercise.exerciseType
        }
      })

      const filtered = exercises.filter(ex => 
        ex.id !== currentExercise.exerciseId &&
        !workoutExercises.some(we => we.exerciseId === ex.id)
      )

      setAvailableExercises(filtered)
      setShowReplaceDialog(true)
    } catch (error) {
      console.error('Ошибка загрузки упражнений для замены:', error)
      toast.error('Ошибка загрузки упражнений')
    }
  }

  const replaceCurrentExercise = async (newExerciseId: string) => {
    if (!currentExercise || !activeWorkout) return

    try {
      // Находим новое упражнение
      const newExercise = availableExercises.find(ex => ex.id === newExerciseId)
      if (!newExercise) return

      // Обновляем упражнение в тренировке
      await blink.db.workoutExercises.update(currentExercise.id, {
        exerciseId: newExerciseId,
        sets: newExercise.sets,
        reps: newExercise.reps
      })

      // Удаляем все существующие подходы для этого упражнения
      for (const set of sets) {
        await blink.db.workoutSets.delete(set.id)
      }

      // Обновляем локальное состояние
      const updatedExercises = [...workoutExercises]
      updatedExercises[currentExerciseIndex] = {
        ...currentExercise,
        exerciseId: newExerciseId,
        sets: newExercise.sets,
        reps: newExercise.reps,
        exercise: newExercise
      }
      setWorkoutExercises(updatedExercises)
      setSets([])
      setTempWeight(0)

      setShowReplaceDialog(false)
      toast.success(`Упражнение заменено на "${newExercise.name}"!`)
    } catch (error) {
      console.error('Ошибка замены упражнения:', error)
      toast.error('Ошибка замены упражнения')
    }
  }

  if (!activeWorkout) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Активная тренировка</h2>
            <p className="text-slate-600">Выполняйте упражнения с таймером</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Timer className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Нет активной тренировки</h3>
            <p className="text-slate-600 text-center mb-4">
              Создайте тренировку в генераторе, чтобы начать заниматься
            </p>
          </CardContent>
        </Card>

        {/* Отдельный таймер для отдыха */}
        <div className="max-w-md mx-auto">
          <Timer />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{activeWorkout.name}</h2>
          <p className="text-slate-600">
            Время: {formatTime(workoutTime)} • Упражнение {currentExerciseIndex + 1} из {workoutExercises.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTimer(!showTimer)}
          >
            <Timer className="h-4 w-4 mr-2" />
            Таймер
          </Button>
          <Button onClick={completeWorkout} variant="default">
            Завершить
          </Button>
        </div>
      </div>

      {/* Прогресс тренировки */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Прогресс тренировки</span>
            <span className="text-sm text-slate-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Основная область упражнения */}
        <div className="lg:col-span-2 space-y-6">
          {currentExercise && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{currentExercise.exercise.name}</CardTitle>
                    <p className="text-slate-600 mt-1">
                      {currentExercise.exercise.muscleGroup} • {currentExercise.exercise.exerciseType}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {currentExercise.exercise.weightType === 'additional' ? 'Доп. вес' :
                       currentExercise.exercise.weightType === 'bodyweight' ? 'Свой вес' : 'Антивес'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openReplaceDialog}
                      title="Заменить упражнение"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentExercise.exercise.technique && (
                  <div>
                    <h4 className="font-medium mb-2">Техника выполнения:</h4>
                    <p className="text-sm text-slate-600">{currentExercise.exercise.technique}</p>
                  </div>
                )}

                {/* Подходы */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Подходы</h4>
                    <Button size="sm" onClick={addSet}>
                      <Plus className="h-4 w-4 mr-1" />
                      Добавить подход
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {sets.map((set, index) => (
                      <div key={set.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium w-8">#{set.setNumber}</span>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateSetWeight(set.id, Math.max(0, set.weight - 2.5))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={set.weight}
                            onChange={(e) => updateSetWeight(set.id, Number(e.target.value))}
                            className="w-16 text-center"
                            step="0.5"
                          />
                          <span className="text-xs text-slate-600">кг</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateSetWeight(set.id, set.weight + 2.5)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={set.reps}
                            onChange={(e) => updateSetReps(set.id, Number(e.target.value))}
                            className="w-16 text-center"
                          />
                          <span className="text-xs text-slate-600">раз</span>
                        </div>

                        <Button
                          variant={set.completed ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSetCompletion(set.id, !set.completed)}
                        >
                          {set.completed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Навигация между упражнениями */}
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={prevExercise}
                    disabled={currentExerciseIndex === 0}
                  >
                    Предыдущее
                  </Button>
                  <span className="text-sm text-slate-600">
                    {currentExerciseIndex + 1} из {workoutExercises.length}
                  </span>
                  <Button
                    variant="outline"
                    onClick={nextExercise}
                    disabled={currentExerciseIndex === workoutExercises.length - 1}
                  >
                    Следующее
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Боковая панель с таймером */}
        <div className="space-y-6">
          {showTimer && (
            <Timer 
              onComplete={() => toast.success('Отдых закончен! Переходите к следующему подходу')}
            />
          )}

          {/* Список упражнений */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Упражнения</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workoutExercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    index === currentExerciseIndex 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    setCurrentExerciseIndex(index)
                    loadSetsForExercise(exercise.id)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{exercise.exercise.name}</h4>
                      <p className="text-xs text-slate-600">{exercise.sets} x {exercise.reps}</p>
                    </div>
                    {index === currentExerciseIndex && (
                      <Dumbbell className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Диалог замены упражнения */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заменить упражнение</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Выберите упражнение для замены "{currentExercise?.exercise.name}"
            </p>
            
            {availableExercises.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Нет доступных упражнений для замены
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableExercises.map((exercise) => (
                  <Card 
                    key={exercise.id} 
                    className="p-3 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => replaceCurrentExercise(exercise.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{exercise.name}</h4>
                        <p className="text-sm text-slate-600">
                          {exercise.sets} подходов × {exercise.reps} повторений
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {exercise.exerciseType}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}