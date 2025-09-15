import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import axios from 'axios'
import { LoginPanel } from '../auth'

// Mock axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

const mockedAxios = vi.mocked(axios)

describe('LoginPanel Component', () => {
  const mockOnAuth = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render login form with all elements', () => {
    render(<LoginPanel onAuth={mockOnAuth} />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should allow user to enter email and password', async () => {
    render(<LoginPanel onAuth={mockOnAuth} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('should successfully login with valid credentials', async () => {
    const mockResponse = {
      data: {
        token: 'jwt-token-123',
        user: { role: 'officer' }
      }
    }
    
    mockedAxios.post.mockResolvedValueOnce(mockResponse)
    
    render(<LoginPanel onAuth={mockOnAuth} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })
    
    fireEvent.change(emailInput, { target: { value: 'officer@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(loginButton)
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:4000/api/auth/login',
        { email: 'officer@example.com', password: 'password123' }
      )
    })
    
    await waitFor(() => {
      expect(mockOnAuth).toHaveBeenCalledWith('jwt-token-123', 'officer')
    })
    
    expect(localStorage.getItem('dash_token')).toBe('jwt-token-123')
  })

  it('should display error message on login failure', async () => {
    const mockError = {
      response: {
        data: { error: 'Invalid credentials' }
      }
    }
    
    mockedAxios.post.mockRejectedValueOnce(mockError)
    
    render(<LoginPanel onAuth={mockOnAuth} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(loginButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
    
    expect(mockOnAuth).not.toHaveBeenCalled()
    expect(localStorage.getItem('dash_token')).toBeNull()
  })

  it('should display generic error message when no error details provided', async () => {
    const mockError = new Error('Network Error')
    
    mockedAxios.post.mockRejectedValueOnce(mockError)
    
    render(<LoginPanel onAuth={mockOnAuth} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(loginButton)
    
    await waitFor(() => {
      expect(screen.getByText('Network Error')).toBeInTheDocument()
    })
  })

  it('should show loading state while submitting', async () => {
    // Create a delayed promise to simulate loading
    let resolvePromise: (value: any) => void
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    
    mockedAxios.post.mockReturnValueOnce(delayedPromise)
    
    render(<LoginPanel onAuth={mockOnAuth} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password' } })
    fireEvent.click(loginButton)
    
    // Check loading state
    expect(loginButton).toHaveTextContent('Logging in...')
    expect(loginButton).toBeDisabled()
    
    // Resolve the promise to finish loading
    resolvePromise!({
      data: { token: 'token', user: { role: 'officer' } }
    })
    
    await waitFor(() => {
      expect(loginButton).not.toBeDisabled()
    })
  })

  it('should prevent form submission with empty fields', () => {
    render(<LoginPanel onAuth={mockOnAuth} />)
    
    const loginButton = screen.getByRole('button', { name: /login/i })
    
    // Try to submit with empty fields
    fireEvent.click(loginButton)
    
    // Should not make API call
    expect(mockedAxios.post).not.toHaveBeenCalled()
    expect(mockOnAuth).not.toHaveBeenCalled()
  })

  it('should handle user without role', async () => {
    const mockResponse = {
      data: {
        token: 'jwt-token-123',
        user: {} // No role specified
      }
    }
    
    mockedAxios.post.mockResolvedValueOnce(mockResponse)
    
    render(<LoginPanel onAuth={mockOnAuth} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(loginButton)
    
    await waitFor(() => {
      expect(mockOnAuth).toHaveBeenCalledWith('jwt-token-123', '')
    })
  })

  it('should clear error message when user starts typing', async () => {
    // First, trigger an error
    const mockError = {
      response: {
        data: { error: 'Invalid credentials' }
      }
    }
    
    mockedAxios.post.mockRejectedValueOnce(mockError)
    
    render(<LoginPanel onAuth={mockOnAuth} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const loginButton = screen.getByRole('button', { name: /login/i })
    
    // Trigger error
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(loginButton)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
    
    // Start typing again - error should be cleared
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
    
    await waitFor(() => {
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
    })
  })

  it('should handle keyboard form submission', async () => {
    const mockResponse = {
      data: {
        token: 'jwt-token-123',
        user: { role: 'officer' }
      }
    }
    
    mockedAxios.post.mockResolvedValueOnce(mockResponse)
    
    render(<LoginPanel onAuth={mockOnAuth} />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // Submit form by pressing Enter on password field
    fireEvent.keyDown(passwordInput, { key: 'Enter', code: 'Enter' })
    
    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled()
    })
  })
})