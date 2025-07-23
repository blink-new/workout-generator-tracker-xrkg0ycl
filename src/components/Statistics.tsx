import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { BarChart3 } from 'lucide-react'

export default function Statistics() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Статистика</h2>
        <p className="text-slate-600">Анализируйте свой прогресс</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Нет данных</h3>
          <p className="text-slate-600 text-center mb-4">
            Выполните несколько тренировок, чтобы увидеть статистику
          </p>
        </CardContent>
      </Card>
    </div>
  )
}