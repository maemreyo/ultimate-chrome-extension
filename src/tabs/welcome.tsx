import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "~components/ui/button"
import { Card, CardContent } from "~components/ui/card"
import { CheckCircle2, ArrowRight, Sparkles, Shield, Zap, Globe } from "lucide-react"
import { useSupabaseAuth } from "~hooks/useSupabaseAuth"

const features = [
  {
    icon: Sparkles,
    title: "Smart Features",
    description: "AI-powered tools to enhance your browsing experience"
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data is encrypted and never shared"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed and performance"
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    description: "Compatible with all your favorite websites"
  }
]

const steps = [
  "Sign in or create an account",
  "Grant necessary permissions",
  "Customize your settings",
  "Start using the extension!"
]

export default function WelcomePage() {
  const { isAuthenticated } = useSupabaseAuth()
  const [currentStep, setCurrentStep] = useState(0)
  
  const handleGetStarted = () => {
    if (!isAuthenticated) {
      chrome.tabs.create({ url: chrome.runtime.getURL("tabs/auth.html") })
    } else {
      chrome.runtime.openOptionsPage()
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4">
            Welcome to Your New Extension
          </h1>
          <p className="text-xl text-muted-foreground">
            Let's get you set up in just a few steps
          </p>
        </motion.div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6 text-center">
                  <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Setup Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Quick Setup</h2>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                      index <= currentStep ? "bg-primary/10" : "bg-muted/50"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    ) : index === currentStep ? (
                      <div className="h-6 w-6 rounded-full border-2 border-primary animate-pulse" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-muted-foreground" />
                    )}
                    <span className={index <= currentStep ? "font-medium" : "text-muted-foreground"}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              
              <Button
                size="lg"
                className="w-full mt-8"
                onClick={handleGetStarted}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}