import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Plus, Dumbbell, RefreshCw, Play, Trash2, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { blink } from '../blink/client'
import type { Exercise, Workout, WorkoutExercise } from '../types'

const MUSCLE_GROUPS = [
  'Грудь', 'Спина', 'Плечи', 'Бицепс', 'Трицепс', 
  'Ноги', 'Ягодицы', 'Пресс', 'Предплечья'
]

const EXERCISE_TYPES = ['основное', 'вспомогательное', 'изолированное'] as const

export default function WorkoutGenerator() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('')
  const [exerciseCount, setExerciseCount] = useState(3)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['основное', 'вспомогательное'])
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutExercise[]>([])
  const [workoutName, setWorkoutName] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const loadExercises = async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.exercises.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setExercises(result)
    } catch (error) {
      console.error('Ошибка загрузки упражнений:', error)
      toast.error('Ошибка загрузки упражнений')
    }
  }

  const loadWorkouts = async () => {
    try {
      const user = await blink.auth.me()
      const result = await blink.db.workouts.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setWorkouts(result)
    } catch (error) {
      console.error('Ошибка загрузки тренировок:', error)
      toast.error('Ошибка загрузки тренировок')
    }
  }

  useEffect(() => {
    loadExercises()
    loadWorkouts()
  }, [])

  const generateWorkout = async () => {
    if (!selectedMuscleGroup) {
      toast.error('Выберите группу мышц')
      return
    }

    if (selectedTypes.length === 0) {
      toast.error('Выберите хотя бы один тип упражнений')
      return
    }

    setIsGenerating(true)
    try {
      console.log('Генерация тренировки:', { selectedMuscleGroup, selectedTypes, exerciseCount })
      console.log('Доступные упражнения:', exercises.length)
      
      // Фильтруем упражнения по группе мышц и типам
      const filteredExercises = exercises.filter(ex => 
        ex.muscleGroup === selectedMuscleGroup && 
        selectedTypes.includes(ex.exerciseType)
      )

      console.log('Отфильтрованные упражнения:', filteredExercises.length, filteredExercises)

      if (filteredExercises.length === 0) {
        toast.error(`Нет упражнений для группы "${selectedMuscleGroup}" и выбранных типов. Добавьте упражнения в базу данных.`)
        setIsGenerating(false)
        return
      }

      // Группируем по типам
      const exercisesByType = selectedTypes.reduce((acc, type) => {
        acc[type] = filteredExercises.filter(ex => ex.exerciseType === type)
        return acc
      }, {} as Record<string, Exercise[]>)

      const workout: WorkoutExercise[] = []
      let addedCount = 0

      // Добавляем упражнения по типам (по одному от каждого типа)
      for (const type of selectedTypes) {
        const typeExercises = exercisesByType[type]
        if (typeExercises.length > 0 && addedCount < exerciseCount) {
          // Случайно выбираем упражнение этого типа
          const randomExercise = typeExercises[Math.floor(Math.random() * typeExercises.length)]
          workout.push({
            id: `we_${Date.now()}_${addedCount}`,
            workoutId: '',
            exerciseId: randomExercise.id,
            sets: randomExercise.sets,
            reps: randomExercise.reps,
            weight: 0,
            completed: false,
            order: addedCount + 1,
            exercise: randomExercise
          })
          addedCount++
        }
      }

      // Если нужно больше упражнений, добавляем случайные из доступных
      while (addedCount < exerciseCount && filteredExercises.length > addedCount) {
        const remainingExercises = filteredExercises.filter(ex => 
          !workout.some(w => w.exerciseId === ex.id)
        )
        if (remainingExercises.length === 0) break
        
        const randomExercise = remainingExercises[Math.floor(Math.random() * remainingExercises.length)]
        workout.push({
          id: `we_${Date.now()}_${addedCount}`,
          workoutId: '',
          exerciseId: randomExercise.id,
          sets: randomExercise.sets,
          reps: randomExercise.reps,
          weight: 0,
          completed: false,
          order: addedCount + 1,
          exercise: randomExercise
        })
        addedCount++
      }

      console.log('Сгенерированная тренировка:', workout)
      setGeneratedWorkout(workout)
      setWorkoutName(`Тренировка ${selectedMuscleGroup} - ${new Date().toLocaleDateString()}`)
      toast.success(`Сгенерирована тренировка из ${workout.length} упражнений!`)
    } catch (error) {
      console.error('Ошибка генерации тренировки:', error)
      toast.error(`Ошибка генерации тренировки: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const replaceExercise = async (index: number) => {
    const currentExercise = generatedWorkout[index]
    if (!currentExercise.exercise) return

    // Находим все упражнения того же типа и группы мышц, исключая текущее
    const availableExercises = exercises.filter(ex => 
      ex.muscleGroup === selectedMuscleGroup && 
      ex.exerciseType === currentExercise.exercise!.exerciseType &&
      ex.id !== currentExercise.exerciseId &&
      !generatedWorkout.some(w => w.exerciseId === ex.id) // Исключаем уже добавленные
    )

    if (availableExercises.length === 0) {
      toast.error(`Нет других упражнений типа "${currentExercise.exercise.exerciseType}" для замены`)
      return
    }

    // Случайно выбираем новое упражнение
    const randomExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)]
    
    const newWorkout = [...generatedWorkout]
    newWorkout[index] = {
      ...newWorkout[index],
      exerciseId: randomExercise.id,
      sets: randomExercise.sets,
      reps: randomExercise.reps,
      exercise: randomExercise
    }
    
    setGeneratedWorkout(newWorkout)
    toast.success(`Упражнение заменено на "${randomExercise.name}"!`)
  }

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      toast.error('Введите название тренировки')
      return
    }

    if (generatedWorkout.length === 0) {
      toast.error('Сначала сгенерируйте тренировку')
      return
    }

    try {
      const user = await blink.auth.me()
      
      // Создаем тренировку
      const workoutId = `workout_${Date.now()}`
      const workout = await blink.db.workouts.create({
        id: workoutId,
        userId: user.id,
        name: workoutName,
        muscleGroup: selectedMuscleGroup,
        status: 'planned',
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        totalTime: 0,
        totalWeight: 0
      })

      // Создаем упражнения тренировки
      for (const workoutExercise of generatedWorkout) {
        await blink.db.workout_exercises.create({
          id: `we_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workoutId: workout.id,
          exerciseId: workoutExercise.exerciseId,
          sets: workoutExercise.sets,
          reps: workoutExercise.reps,
          weight: workoutExercise.weight,
          completed: false,
          order: workoutExercise.order
        })
      }

      toast.success('Тренировка сохранена!')
      setShowCreateDialog(false)
      setGeneratedWorkout([])
      setWorkoutName('')
      loadWorkouts()
    } catch (error) {
      console.error('Ошибка сохранения тренировки:', error)
      toast.error('Ошибка сохранения тренировки')
    }
  }

  const deleteWorkout = async (workoutId: string) => {
    try {
      // Удаляем связанные упражнения
      const workoutExercises = await blink.db.workout_exercises.list({
        where: { workoutId }
      })
      for (const we of workoutExercises) {
        await blink.db.workout_exercises.delete(we.id)
        
        // Удаляем связанные подходы
        const sets = await blink.db.workout_sets.list({
          where: { workoutExerciseId: we.id }
        })
        for (const set of sets) {
          await blink.db.workout_sets.delete(set.id)
        }
      }
      
      // Удаляем тренировку
      await blink.db.workouts.delete(workoutId)
      
      toast.success('Тренировка удалена')
      loadWorkouts()
    } catch (error) {
      console.error('Ошибка удаления тренировки:', error)
      toast.error('Ошибка удаления тренировки')
    }
  }

  const startWorkout = async (workoutId: string) => {
    try {
      const startTime = new Date().toISOString()
      await blink.db.workouts.update(workoutId, {
        status: 'active',
        startedAt: startTime
      })
      
      toast.success('Тренировка начата! Переходите в раздел "Активная тренировка"')
      loadWorkouts()
    } catch (error) {
      console.error('Ошибка начала тренировки:', error)
      toast.error('Ошибка начала тренировки')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Генератор тренировок</h2>
          <p className="text-slate-600">Создавайте персональные программы тренировок</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Создать тренировку
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Генератор тренировки</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Группа мышц</Label>
                  <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите группу мышц" />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSCLE_GROUPS.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Количество упражнений</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={exerciseCount}
                    onChange={(e) => setExerciseCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Типы упражнений</Label>
                <div className="flex flex-wrap gap-2">
                  {EXERCISE_TYPES.map(type => (
                    <Badge
                      key={type}
                      variant={selectedTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (selectedTypes.includes(type)) {
                          setSelectedTypes(selectedTypes.filter(t => t !== type))
                        } else {
                          setSelectedTypes([...selectedTypes, type])
                        }
                      }}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={generateWorkout} 
                disabled={isGenerating || !selectedMuscleGroup || selectedTypes.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Dumbbell className="h-4 w-4 mr-2" />
                    Сгенерировать тренировку
                  </>
                )}
              </Button>

              {generatedWorkout.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Название тренировки</Label>
                    <Input
                      value={workoutName}
                      onChange={(e) => setWorkoutName(e.target.value)}
                      placeholder="Введите название тренировки"
                    />
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Сгенерированная тренировка:</h4>
                    {generatedWorkout.map((workoutExercise, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium">{workoutExercise.exercise?.name}</h5>
                            <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                              <span>{workoutExercise.sets} подходов</span>
                              <span>{workoutExercise.reps} повторений</span>
                              <Badge variant="outline" className="text-xs">
                                {workoutExercise.exercise?.exerciseType}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => replaceExercise(index)}
                            title="Заменить упражнение"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button onClick={saveWorkout} className="w-full">
                    Сохранить тренировку
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Список сохраненных тренировок */}
      <div className="grid gap-4">
        {workouts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Нет тренировок</h3>
              <p className="text-slate-600 text-center mb-4">
                Создайте свою первую тренировку с помощью генератора
              </p>
            </CardContent>
          </Card>
        ) : (
          workouts.map(workout => (
            <Card key={workout.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{workout.name}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">
                      {workout.muscleGroup} • {new Date(workout.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={workout.status === 'completed' ? 'default' : 
                                   workout.status === 'active' ? 'destructive' : 'outline'}>
                      {workout.status === 'completed' ? 'Завершена' : 
                       workout.status === 'active' ? 'Активна' : 'Запланирована'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startWorkout(workout.id)}
                      disabled={workout.status === 'active'}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWorkout(workout.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}