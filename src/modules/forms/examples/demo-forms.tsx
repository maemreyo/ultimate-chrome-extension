import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~components/ui/tabs'
import { Button } from '~components/ui/button'
import { toast } from 'react-hot-toast'
import { FormProvider, FormBuilder, AutoForm } from '../components'
import { schemas, userSchemas, settingsSchemas } from '../schemas'
import { useFormWizard } from '../hooks'
import { z } from 'zod'

export function FormDemos() {
  const [activeTab, setActiveTab] = useState('basic')

  // Basic form example
  const handleContactSubmit = async (data: z.infer<typeof schemas.contact>) => {
    console.log('Contact form data:', data)
    toast.success('Form submitted successfully!')
  }

  // Auto form example
  const handleLoginSubmit = async (data: z.infer<typeof schemas.login>) => {
    console.log('Login data:', data)
    toast.success('Login successful!')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form System Examples</CardTitle>
          <CardDescription>
            Examples of different form patterns and configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Form</TabsTrigger>
              <TabsTrigger value="auto">Auto Form</TabsTrigger>
              <TabsTrigger value="wizard">Form Wizard</TabsTrigger>
              <TabsTrigger value="complex">Complex Form</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <FormProvider
                schema={schemas.contact}
                onSubmit={handleContactSubmit}
                defaultValues={{
                  name: '',
                  email: '',
                  subject: '',
                  message: ''
                }}
                persistKey="contact-form"
              >
                {(form) => (
                  <FormBuilder
                    form={form}
                    layout={{
                      sections: [{
                        title: 'Contact Information',
                        fields: [
                          { name: 'name', label: 'Full Name', required: true },
                          { name: 'email', label: 'Email Address', type: 'email', required: true },
                          { name: 'phone', label: 'Phone Number', type: 'tel' }
                        ],
                        columns: 2
                      }, {
                        title: 'Message',
                        fields: [
                          { name: 'subject', label: 'Subject', required: true },
                          {
                            name: 'message',
                            label: 'Message',
                            type: 'textarea',
                            description: 'Please provide as much detail as possible',
                            required: true
                          }
                        ]
                      }],
                      submitLabel: 'Send Message'
                    }}
                  />
                )}
              </FormProvider>
            </TabsContent>

            <TabsContent value="auto" className="mt-6">
              <AutoForm
                schema={schemas.login}
                onSubmit={handleLoginSubmit}
                title="Login Form"
                description="This form is automatically generated from the Zod schema"
                submitLabel="Sign In"
                persistKey="login-form"
              />
            </TabsContent>

            <TabsContent value="wizard" className="mt-6">
              <WizardFormExample />
            </TabsContent>

            <TabsContent value="complex" className="mt-6">
              <ComplexFormExample />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

// Wizard form example
function WizardFormExample() {
  const registrationSchema = schemas.register.extend({
    profile: userSchemas.profile.pick({
      firstName: true,
      lastName: true,
      phone: true,
      bio: true
    })
  })

  type RegistrationData = z.infer<typeof registrationSchema>

  const steps = [
    {
      id: 'account',
      title: 'Account Information',
      description: 'Create your account credentials',
      fields: ['username', 'email', 'password', 'confirmPassword']
    },
    {
      id: 'profile',
      title: 'Profile Information',
      description: 'Tell us about yourself',
      fields: ['profile.firstName', 'profile.lastName', 'profile.phone', 'profile.bio']
    }
  ]

  return (
    <FormProvider
      schema={registrationSchema}
      onSubmit={async (data) => {
        console.log('Registration data:', data)
        toast.success('Registration complete!')
      }}
    >
      {(form) => {
        const wizard = useFormWizard(form, steps)

        return (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${wizard.progress}%` }}
              />
            </div>

            {/* Step indicator */}
            <div className="flex justify-between mb-6">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center ${
                    index <= wizard.currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    wizard.completedSteps.includes(index)
                      ? 'bg-primary text-white border-primary'
                      : index === wizard.currentStep
                      ? 'border-primary'
                      : 'border-muted-foreground'
                  }`}>
                    {wizard.completedSteps.includes(index) ? '✓' : index + 1}
                  </div>
                  <span className="ml-2 text-sm">{step.title}</span>
                </div>
              ))}
            </div>

            {/* Current step content */}
            <Card>
              <CardHeader>
                <CardTitle>{wizard.currentStepData.title}</CardTitle>
                {wizard.currentStepData.description && (
                  <CardDescription>{wizard.currentStepData.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <FormBuilder
                  form={form}
                  layout={{
                    sections: [{
                      fields: wizard.currentStepData.fields.map(field => ({
                        name: field,
                        label: field.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim(),
                        required: true
                      }))
                    }],
                    submitLabel: wizard.isLastStep ? 'Complete Registration' : 'Next',
                    showCancel: !wizard.isFirstStep
                  }}
                />
              </CardContent>
            </Card>

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={wizard.goToPrevious}
                disabled={wizard.isFirstStep}
              >
                Previous
              </Button>
              <Button
                type={wizard.isLastStep ? 'submit' : 'button'}
                onClick={wizard.isLastStep ? undefined : wizard.goToNext}
              >
                {wizard.isLastStep ? 'Complete' : 'Next'}
              </Button>
            </div>
          </div>
        )
      }}
    </FormProvider>
  )
}

// Complex form example
function ComplexFormExample() {
  const complexSchema = z.object({
    general: settingsSchemas.general,
    notifications: userSchemas.preferences.shape.notifications,
    api: settingsSchemas.api,
    experimental: settingsSchemas.extension.shape.experimental
  })

  return (
    <FormProvider
      schema={complexSchema}
      onSubmit={async (data) => {
        console.log('Settings data:', data)
        toast.success('Settings saved!')
      }}
      persistKey="app-settings"
    >
      {(form) => (
        <FormBuilder
          form={form}
          layout={{
            sections: [
              {
                title: 'General Settings',
                description: 'Configure basic application settings',
                fields: [
                  { name: 'general.siteName', label: 'Site Name', required: true },
                  { name: 'general.siteUrl', label: 'Site URL', type: 'url', required: true },
                  { name: 'general.contactEmail', label: 'Contact Email', type: 'email', required: true },
                  {
                    name: 'general.timezone',
                    label: 'Timezone',
                    type: 'select',
                    options: [
                      { label: 'UTC', value: 'UTC' },
                      { label: 'America/New_York', value: 'America/New_York' },
                      { label: 'Europe/London', value: 'Europe/London' },
                      { label: 'Asia/Tokyo', value: 'Asia/Tokyo' }
                    ]
                  }
                ],
                columns: 2
              },
              {
                title: 'Notification Preferences',
                description: 'Choose how you want to receive notifications',
                fields: [
                  { name: 'notifications.email', label: 'Email Notifications', type: 'switch' },
                  { name: 'notifications.push', label: 'Push Notifications', type: 'switch' },
                  { name: 'notifications.sms', label: 'SMS Notifications', type: 'switch' }
                ]
              },
              {
                title: 'API Configuration',
                description: 'Configure external API settings',
                fields: [
                  { name: 'api.endpoint', label: 'API Endpoint', type: 'url', required: true },
                  { name: 'api.apiKey', label: 'API Key', type: 'password', required: true },
                  { name: 'api.timeout', label: 'Timeout (ms)', type: 'number' },
                  { name: 'api.retries', label: 'Max Retries', type: 'number' }
                ],
                columns: 2
              },
              {
                title: 'Experimental Features',
                description: 'Enable experimental features at your own risk',
                fields: [
                  {
                    name: 'experimental.newUI',
                    label: 'Enable New UI',
                    type: 'switch',
                    description: 'Try out our new user interface design'
                  },
                  {
                    name: 'experimental.betaFeatures',
                    label: 'Beta Features',
                    type: 'switch',
                    description: 'Access features still in development'
                  }
                ]
              }
            ],
            submitLabel: 'Save Settings',
            showReset: true
          }}
        />
      )}
    </FormProvider>
  )
}