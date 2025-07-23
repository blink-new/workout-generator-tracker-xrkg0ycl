import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { History } from 'lucide-react'

export default function WorkoutHistory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">История тренировок</h2>
        <p className="text-slate-600">Просматривайте свои прошлые тренировки</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <History className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Нет истории</h3>
          <p className="text-slate-600 text-center mb-4">
            Завершите первую тренировку, чтобы увидеть историю
          </p>
        </CardContent>
      </Card>
    </div>
  )
}