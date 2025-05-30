import { useState, useCallback } from 'react'
import { UseFormReturn, FieldValues } from 'react-hook-form'

export interface WizardStep {
  id: string
  title: string
  description?: string
  fields: string[]
  validate?: (data: any) => boolean | Promise<boolean>
}

export function useFormWizard<T extends FieldValues>(
  form: UseFormReturn<T>,
  steps: WizardStep[]
) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const canGoNext = useCallback(async () => {
    const step = steps[currentStep]

    // Validate current step fields
    const fieldsValid = await Promise.all(
      step.fields.map(field => form.trigger(field as any))
    )

    if (!fieldsValid.every(v => v)) {
      return false
    }

    // Run custom validation if provided
    if (step.validate) {
      const values = form.getValues()
      return await step.validate(values)
    }

    return true
  }, [form, steps, currentStep])

  const goToNext = useCallback(async () => {
    if (await canGoNext()) {
      setCompletedSteps(prev => [...prev, currentStep])
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }, [canGoNext, currentStep, steps.length])

  const goToPrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step)
    }
  }, [steps.length])

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  return {
    currentStep,
    completedSteps,
    currentStepData: steps[currentStep],
    goToNext,
    goToPrevious,
    goToStep,
    isFirstStep,
    isLastStep,
    progress,
    canGoNext
  }
}