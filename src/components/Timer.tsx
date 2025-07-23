import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Play, Pause, RotateCcw, Timer as TimerIcon, Settings, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'

interface TimerProps {
  onComplete?: () => void
  className?: string
}

export default function Timer({ onComplete, className = '' }: TimerProps) {
  const [time, setTime] = useState(60) // время в секундах
  const [initialTime, setInitialTime] = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(1)
  const [customSeconds, setCustomSeconds] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Предустановленные времена
  const presetTimes = [
    { label: '30 сек', seconds: 30 },
    { label: '1 мин', seconds: 60 },
    { label: '2 мин', seconds: 120 },
    { label: '3 мин', seconds: 180 },
    { label: '5 мин', seconds: 300 }
  ]

  useEffect(() => {
    // Создаем аудио для уведомления
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 1) {
            setIsRunning(false)
            if (soundEnabled && audioRef.current) {
              audioRef.current.play().catch(() => {
                // Fallback если звук не воспроизводится
                toast.success('⏰ Время вышло!')
              })
            }
            toast.success('⏰ Время вышло!')
            onComplete?.()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, time, soundEnabled, onComplete])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    if (time > 0) {
      setIsRunning(true)
    }
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTime(initialTime)
  }

  const setPresetTime = (seconds: number) => {
    setTime(seconds)
    setInitialTime(seconds)
    setIsRunning(false)
  }

  const setCustomTime = () => {
    const totalSeconds = customMinutes * 60 + customSeconds
    if (totalSeconds > 0) {
      setTime(totalSeconds)
      setInitialTime(totalSeconds)
      setIsRunning(false)
      setShowSettings(false)
      toast.success(`Таймер установлен на ${formatTime(totalSeconds)}`)
    }
  }

  const progress = initialTime > 0 ? ((initialTime - time) / initialTime) * 100 : 0

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TimerIcon className="h-5 w-5" />
            Таймер отдыха
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Настройки таймера</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Быстрая установка</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {presetTimes.map(preset => (
                        <Button
                          key={preset.seconds}
                          variant="outline"
                          size="sm"
                          onClick={() => setPresetTime(preset.seconds)}
                          className={time === preset.seconds ? 'bg-blue-50 border-blue-200' : ''}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Пользовательское время</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-slate-600">Минуты</Label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={customMinutes}
                          onChange={(e) => setCustomMinutes(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-slate-600">Секунды</Label>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          value={customSeconds}
                          onChange={(e) => setCustomSeconds(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <Button onClick={setCustomTime} className="w-full">
                      Установить время
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Круговой прогресс */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              {/* Фоновый круг */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-200"
              />
              {/* Прогресс */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                className={`transition-all duration-1000 ${
                  time <= 10 ? 'text-red-500' : 
                  time <= 30 ? 'text-amber-500' : 
                  'text-blue-500'
                }`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${
                time <= 10 ? 'text-red-500' : 
                time <= 30 ? 'text-amber-500' : 
                'text-slate-900'
              }`}>
                {formatTime(time)}
              </span>
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={resetTimer}
              disabled={time === initialTime && !isRunning}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            {!isRunning ? (
              <Button
                onClick={startTimer}
                disabled={time === 0}
                className="px-6"
              >
                <Play className="h-4 w-4 mr-2" />
                Старт
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                variant="outline"
                className="px-6"
              >
                <Pause className="h-4 w-4 mr-2" />
                Пауза
              </Button>
            )}
          </div>

          {/* Быстрые кнопки времени */}
          <div className="flex flex-wrap gap-2 justify-center">
            {presetTimes.slice(0, 3).map(preset => (
              <Button
                key={preset.seconds}
                variant="ghost"
                size="sm"
                onClick={() => setPresetTime(preset.seconds)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}