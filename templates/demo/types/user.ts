/**
 * User type definitions matching DummyJSON API response
 * API: https://dummyjson.com/users
 */

export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  age: number
  gender: string
  image: string
  company: {
    name: string
    title: string
  }
  // Additional fields from DummyJSON API (optional)
  maidenName?: string
  username?: string
  birthDate?: string
  bloodGroup?: string
  height?: number
  weight?: number
  eyeColor?: string
  hair?: {
    color: string
    type: string
  }
  ip?: string
  address?: {
    address: string
    city: string
    state: string
    stateCode: string
    postalCode: string
    coordinates: {
      lat: number
      lng: number
    }
    country: string
  }
  macAddress?: string
  university?: string
  bank?: {
    cardExpire: string
    cardNumber: string
    cardType: string
    currency: string
    iban: string
  }
  ein?: string
  ssn?: string
  userAgent?: string
  crypto?: {
    coin: string
    wallet: string
    network: string
  }
  role?: string
}

export interface UsersResponse {
  users: User[]
  total: number
  skip: number
  limit: number
}
