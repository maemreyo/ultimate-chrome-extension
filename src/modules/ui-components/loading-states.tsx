import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '~lib/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function SpinnerLoading({ size = 'md', text, className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  )
}

export function DotsLoading({ size = 'md', text, className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div className="flex gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn('bg-gray-400 dark:bg-gray-600 rounded-full', sizeClasses[size])}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.2
            }}
          />
        ))}
      </div>
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  )
}

export function PulseLoading({ size = 'md', text, className }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <div className="relative">
        <motion.div
          className={cn('absolute inset-0 bg-blue-400 rounded-full opacity-75', sizeClasses[size])}
          animate={{ scale: [0, 1.2], opacity: [0.75, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <div className={cn('bg-blue-500 rounded-full', sizeClasses[size])} />
      </div>
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
    </div>
  )
}

export function SkeletonLoading({
  lines = 3,
  className
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

export function ProgressLoading({
  progress,
  text,
  className
}: {
  progress: number
  text?: string
  className?: string
}) {
  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
        {text && <span>{text}</span>}
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  )
}