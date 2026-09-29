export interface LoginRequest {
    dni: string
    password: string
}

export interface LoginResponse {
    access_token: string
    token_type: string
    user: {
        id: string
        dni: string
        full_name: string
        role: string
    }
}