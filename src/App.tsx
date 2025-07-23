import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Dumbbell, Plus, Play, History, BarChart3, Timer } from 'lucide-react'
import ExerciseDatabase from './components/ExerciseDatabase'
import WorkoutGenerator from './components/WorkoutGenerator'
import ActiveWorkout from './components/ActiveWorkout'
import WorkoutHistory from './components/WorkoutHistory'
import Statistics from './components/Statistics'
import { Toaster } from './components/ui/toaster'

interface User {
  id: string
  email: string
  displayName?: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('exercises')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Dumbbell className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Умный тренер</CardTitle>
            <p className="text-slate-600">Войдите для доступа к тренировкам</p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => blink.auth.login()} 
              className="w-full"
            >
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Dumbbell className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-slate-900">Умный тренер</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Привет, {user.displayName || user.email}!
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => blink.auth.logout()}
              >
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="exercises" className="flex items-center space-x-2">
              <Dumbbell className="h-4 w-4" />
              <span className="hidden sm:inline">База упражнений</span>
            </TabsTrigger>
            <TabsTrigger value="generator" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Генератор</span>
            </TabsTrigger>
            <TabsTrigger value="workout" className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Тренировка</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">История</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Статистика</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exercises">
            <ExerciseDatabase />
          </TabsContent>

          <TabsContent value="generator">
            <WorkoutGenerator />
          </TabsContent>

          <TabsContent value="workout">
            <ActiveWorkout />
          </TabsContent>

          <TabsContent value="history">
            <WorkoutHistory />
          </TabsContent>

          <TabsContent value="stats">
            <Statistics />
          </TabsContent>
        </Tabs>
      </main>
      
      <Toaster />
    </div>
  )
}

export default App