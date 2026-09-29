import { apiFetch } from './api'
import type { LoginRequest, LoginResponse } from '../types/auth'

export async function login(
    credentials: LoginRequest
): Promise<LoginResponse> {
    const response = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    })

    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('user', JSON.stringify(response.user))

    return response
}

export function logout(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
}

export function getStoredUser() {
    const user = localStorage.getItem('user')

    if (!user) {
        return null
    }

    try {
        return JSON.parse(user)
    } catch {
        return null
    }
}

export function isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('access_token'))
}