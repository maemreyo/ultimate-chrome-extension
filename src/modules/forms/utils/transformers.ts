export const transformers = {
  // Trim whitespace
  trim: (value: string) => value.trim(),

  // Lowercase
  lowercase: (value: string) => value.toLowerCase(),

  // Uppercase
  uppercase: (value: string) => value.toUpperCase(),

  // Title case
  titleCase: (value: string) => {
    return value.replace(
      /\w\S*/g,
      txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
  },

  // Remove special characters
  alphanumeric: (value: string) => value.replace(/[^a-zA-Z0-9]/g, ''),

  // Format phone number
  formatPhone: (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
  },

  // Format credit card
  formatCreditCard: (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const groups = numbers.match(/.{1,4}/g) || []
    return groups.join(' ')
  }
}