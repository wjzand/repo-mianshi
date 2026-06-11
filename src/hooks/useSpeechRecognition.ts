import { useState, useEffect, useRef, useCallback } from 'react'

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported'

interface SpeechRecognitionError extends Error {
  error: SpeechRecognitionErrorCode
  message: string
}

interface SpeechRecognitionResultItem {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResult {
  isFinal: boolean
  0: SpeechRecognitionResultItem
  length: number
  [index: number]: SpeechRecognitionResultItem
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onerror: ((event: SpeechRecognitionError) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onnomatch: ((event: Event) => void) | null
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean
  isListening: boolean
  transcript: string
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isListeningRef = useRef(false)

  useEffect(() => {
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognitionAPI) {
      setIsSupported(true)

      const recognition = new SpeechRecognitionAPI()
      recognition.lang = 'zh-CN'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const text = result[0].transcript
          if (result.isFinal) {
            finalTranscript += text
          } else {
            interimTranscript += text
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionError) => {
        let errorMessage = '语音识别出错'

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            errorMessage = '未授权麦克风权限，请在浏览器设置中允许访问麦克风'
            break
          case 'audio-capture':
            errorMessage = '未检测到麦克风设备'
            break
          case 'network':
            errorMessage = '网络连接异常，语音识别需要网络支持'
            break
          case 'no-speech':
            errorMessage = '未检测到语音输入'
            break
          case 'aborted':
            errorMessage = '语音识别被中止'
            break
          case 'language-not-supported':
            errorMessage = '不支持当前语言设置'
            break
          default:
            errorMessage = `语音识别错误: ${event.message || event.error}`
        }

        setError(errorMessage)
        setIsListening(false)
        isListeningRef.current = false
      }

      recognition.onend = () => {
        if (isListeningRef.current) {
          try {
            recognition.start()
          } catch {
            setIsListening(false)
            isListeningRef.current = false
          }
        } else {
          setIsListening(false)
        }
      }

      recognition.onstart = () => {
        setIsListening(true)
        setError(null)
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        isListeningRef.current = false
        recognitionRef.current.abort()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('当前浏览器不支持语音识别')
      return
    }

    if (isListeningRef.current) {
      return
    }

    setError(null)
    isListeningRef.current = true

    try {
      recognitionRef.current.start()
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动语音识别失败')
      isListeningRef.current = false
      setIsListening(false)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      return
    }

    isListeningRef.current = false
    recognitionRef.current.stop()
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}
