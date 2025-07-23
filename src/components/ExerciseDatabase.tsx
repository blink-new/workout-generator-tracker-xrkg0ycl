import { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Exercise, MUSCLE_GROUPS, WEIGHT_TYPES, EXERCISE_TYPES } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Plus, Edit, Trash2, Dumbbell } from 'lucide-react'
import { useToast } from '../hooks/use-toast'

export default function ExerciseDatabase() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: '',
    weightType: 'bodyweight' as const,
    technique: '',
    equipmentSetup: '',
    exerciseType: 'main' as const,
    equipmentName: '',
    equipmentPhoto: '',
    sets: 3,
    reps: 10
  })
  const { toast } = useToast()

  const resetForm = () => {
    setFormData({
      name: '',
      muscleGroup: '',
      weightType: 'bodyweight',
      technique: '',
      equipmentSetup: '',
      exerciseType: 'main',
      equipmentName: '',
      equipmentPhoto: '',
      sets: 3,
      reps: 10
    })
  }

  const loadExercises = useCallback(async () => {
    try {
      const user = await blink.auth.me()
      const data = await blink.db.exercises.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setExercises(data)
    } catch (error) {
      console.error('Ошибка загрузки упражнений:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить упражнения',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const user = await blink.auth.me()
      
      if (editingExercise) {
        await blink.db.exercises.update(editingExercise.id, {
          ...formData,
          updatedAt: new Date().toISOString()
        })
        toast({
          title: 'Успешно',
          description: 'Упражнение обновлено'
        })
      } else {
        await blink.db.exercises.create({
          id: `exercise_${Date.now()}`,
          userId: user.id,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        toast({
          title: 'Успешно',
          description: 'Упражнение добавлено'
        })
      }
      
      setIsDialogOpen(false)
      setEditingExercise(null)
      resetForm()
      loadExercises()
    } catch (error) {
      console.error('Ошибка сохранения упражнения:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить упражнение',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setFormData({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      weightType: exercise.weightType,
      technique: exercise.technique,
      equipmentSetup: exercise.equipmentSetup || '',
      exerciseType: exercise.exerciseType,
      equipmentName: exercise.equipmentName || '',
      equipmentPhoto: exercise.equipmentPhoto || '',
      sets: exercise.sets,
      reps: exercise.reps
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить упражнение?')) return
    
    try {
      await blink.db.exercises.delete(id)
      toast({
        title: 'Успешно',
        description: 'Упражнение удалено'
      })
      loadExercises()
    } catch (error) {
      console.error('Ошибка удаления упражнения:', error)
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить упражнение',
        variant: 'destructive'
      })
    }
  }

  const getWeightTypeLabel = (type: string) => {
    return WEIGHT_TYPES.find(wt => wt.value === type)?.label || type
  }

  const getExerciseTypeLabel = (type: string) => {
    return EXERCISE_TYPES.find(et => et.value === type)?.label || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Dumbbell className="h-8 w-8 text-blue-600 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">База упражнений</h2>
          <p className="text-slate-600">Управляйте своими упражнениями</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить упражнение
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingExercise ? 'Редактировать упражнение' : 'Добавить упражнение'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Название упражнения</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="muscleGroup">Группа мышц</Label>
                  <Select value={formData.muscleGroup} onValueChange={(value) => setFormData({ ...formData, muscleGroup: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите группу мышц" />
                    </SelectTrigger>
                    <SelectContent>
                      {MUSCLE_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weightType">Тип веса</Label>
                  <Select value={formData.weightType} onValueChange={(value: any) => setFormData({ ...formData, weightType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEIGHT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="exerciseType">Тип упражнения</Label>
                  <Select value={formData.exerciseType} onValueChange={(value: any) => setFormData({ ...formData, exerciseType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXERCISE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sets">Количество подходов</Label>
                  <Input
                    id="sets"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.sets}
                    onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="reps">Количество повторений</Label>
                  <Input
                    id="reps"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.reps}
                    onChange={(e) => setFormData({ ...formData, reps: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="technique">Техника выполнения</Label>
                <Textarea
                  id="technique"
                  value={formData.technique}
                  onChange={(e) => setFormData({ ...formData, technique: e.target.value })}
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="equipmentSetup">Настройка тренажера (опционально)</Label>
                <Textarea
                  id="equipmentSetup"
                  value={formData.equipmentSetup}
                  onChange={(e) => setFormData({ ...formData, equipmentSetup: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="equipmentName">Название тренажера (опционально)</Label>
                  <Input
                    id="equipmentName"
                    value={formData.equipmentName}
                    onChange={(e) => setFormData({ ...formData, equipmentName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="equipmentPhoto">Фото тренажера (URL, опционально)</Label>
                  <Input
                    id="equipmentPhoto"
                    value={formData.equipmentPhoto}
                    onChange={(e) => setFormData({ ...formData, equipmentPhoto: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit">
                  {editingExercise ? 'Обновить' : 'Добавить'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">Нет упражнений</h3>
            <p className="text-slate-600 text-center mb-4">
              Добавьте первое упражнение, чтобы начать создавать тренировки
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{exercise.name}</CardTitle>
                    <p className="text-sm text-slate-600">{exercise.muscleGroup}</p>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(exercise)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exercise.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{getWeightTypeLabel(exercise.weightType)}</Badge>
                  <Badge variant="outline">{getExerciseTypeLabel(exercise.exerciseType)}</Badge>
                </div>
                <div className="text-sm text-slate-600">
                  <p><strong>Подходы:</strong> {exercise.sets} x {exercise.reps}</p>
                  {exercise.equipmentName && (
                    <p><strong>Тренажер:</strong> {exercise.equipmentName}</p>
                  )}
                </div>
                <p className="text-sm text-slate-700 line-clamp-3">{exercise.technique}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}