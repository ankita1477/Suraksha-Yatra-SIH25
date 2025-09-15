import MockAdapter from 'axios-mock-adapter';
import { api } from '../services/api';
import { loginRequest, registerRequest, AuthUser, AuthResponse } from '../services/authService';

describe('Auth Service', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(api);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('loginRequest', () => {
    it('should login successfully with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      const mockUser: AuthUser = {
        id: 'user-123',
        email: email,
        role: 'tourist',
        did: 'did:example:123'
      };

      const mockResponse: AuthResponse = {
        token: 'jwt-token-123',
        refreshToken: 'refresh-token-123',
        user: mockUser
      };

      mockAxios.onPost('/auth/login').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.email).toBe(email);
        expect(data.password).toBe(password);
        return [200, mockResponse];
      });

      const result = await loginRequest(email, password);

      expect(result).toEqual(mockResponse);
      expect(result.token).toBe('jwt-token-123');
      expect(result.user.email).toBe(email);
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe('/auth/login');
    });

    it('should handle invalid credentials', async () => {
      const email = 'invalid@example.com';
      const password = 'wrongpassword';

      mockAxios.onPost('/auth/login').reply(401, {
        error: 'Invalid credentials'
      });

      await expect(loginRequest(email, password)).rejects.toThrow();
    });

    it('should handle network errors during login', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAxios.onPost('/auth/login').networkError();

      await expect(loginRequest(email, password)).rejects.toThrow('Network Error');
    });

    it('should handle server errors during login', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAxios.onPost('/auth/login').reply(500, {
        error: 'Internal server error'
      });

      await expect(loginRequest(email, password)).rejects.toThrow();
    });

    it('should handle missing email or password', async () => {
      const testCases = [
        { email: '', password: 'password123' },
        { email: 'test@example.com', password: '' },
        { email: '', password: '' }
      ];

      for (const testCase of testCases) {
        mockAxios.reset();
        mockAxios.onPost('/auth/login').reply(400, {
          error: 'Email and password are required'
        });

        await expect(loginRequest(testCase.email, testCase.password))
          .rejects.toThrow();
      }
    });

    it('should handle malformed email addresses', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'test@',
        'test..test@example.com'
      ];

      for (const email of invalidEmails) {
        mockAxios.reset();
        mockAxios.onPost('/auth/login').reply(400, {
          error: 'Invalid email format'
        });

        await expect(loginRequest(email, 'password123'))
          .rejects.toThrow();
      }
    });
  });

  describe('registerRequest', () => {
    it('should register successfully with valid data', async () => {
      const email = 'newuser@example.com';
      const password = 'newpassword123';
      
      const mockUser: AuthUser = {
        id: 'user-456',
        email: email,
        role: 'tourist',
        did: 'did:example:456'
      };

      const mockResponse: AuthResponse = {
        token: 'jwt-token-456',
        refreshToken: 'refresh-token-456',
        user: mockUser
      };

      mockAxios.onPost('/auth/register').reply((config) => {
        const data = JSON.parse(config.data);
        expect(data.email).toBe(email);
        expect(data.password).toBe(password);
        return [201, mockResponse];
      });

      const result = await registerRequest(email, password);

      expect(result).toEqual(mockResponse);
      expect(result.token).toBe('jwt-token-456');
      expect(result.user.email).toBe(email);
      expect(mockAxios.history.post).toHaveLength(1);
      expect(mockAxios.history.post[0].url).toBe('/auth/register');
    });

    it('should handle duplicate email registration', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      mockAxios.onPost('/auth/register').reply(409, {
        error: 'Email already exists'
      });

      await expect(registerRequest(email, password)).rejects.toThrow();
    });

    it('should handle weak passwords', async () => {
      const email = 'test@example.com';
      const weakPasswords = ['123', 'password', 'abc'];

      for (const password of weakPasswords) {
        mockAxios.reset();
        mockAxios.onPost('/auth/register').reply(400, {
          error: 'Password too weak'
        });

        await expect(registerRequest(email, password))
          .rejects.toThrow();
      }
    });

    it('should handle network errors during registration', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAxios.onPost('/auth/register').networkError();

      await expect(registerRequest(email, password)).rejects.toThrow('Network Error');
    });

    it('should handle server errors during registration', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAxios.onPost('/auth/register').reply(500, {
        error: 'Internal server error'
      });

      await expect(registerRequest(email, password)).rejects.toThrow();
    });

    it('should validate registration data format', async () => {
      const validRegistrations = [
        {
          email: 'user1@example.com',
          password: 'StrongPassword123!'
        },
        {
          email: 'user.name+tag@domain.co.uk',
          password: 'AnotherGoodPass456'
        }
      ];

      for (const registration of validRegistrations) {
        mockAxios.reset();
        const mockResponse: AuthResponse = {
          token: 'token',
          refreshToken: 'refresh',
          user: {
            id: 'id',
            email: registration.email,
            role: 'tourist'
          }
        };
        
        mockAxios.onPost('/auth/register').reply(201, mockResponse);

        const result = await registerRequest(registration.email, registration.password);
        expect(result.user.email).toBe(registration.email);
      }
    });
  });

  describe('Request Format Validation', () => {
    it('should send requests with correct content type', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAxios.onPost('/auth/login').reply((config) => {
        expect(config.headers?.['Content-Type']).toContain('application/json');
        return [200, { token: 'test', refreshToken: 'test', user: { id: '1', email } }];
      });

      await loginRequest(email, password);
    });

    it('should handle timeout errors', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      mockAxios.onPost('/auth/login').timeout();

      await expect(loginRequest(email, password)).rejects.toThrow();
    });
  });

  describe('Response Data Validation', () => {
    it('should handle missing required fields in response', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      // Response missing required fields
      mockAxios.onPost('/auth/login').reply(200, {
        token: 'token',
        // Missing refreshToken and user
      });

      const result = await loginRequest(email, password);
      expect(result.token).toBe('token');
      // Should still return the response even if incomplete
    });

    it('should preserve all user data from response', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      
      const completeUser: AuthUser = {
        id: 'user-789',
        email: email,
        role: 'officer',
        did: 'did:example:789'
      };

      const completeResponse: AuthResponse = {
        token: 'complete-token',
        refreshToken: 'complete-refresh',
        user: completeUser
      };

      mockAxios.onPost('/auth/login').reply(200, completeResponse);

      const result = await loginRequest(email, password);
      
      expect(result.user).toEqual(completeUser);
      expect(result.user.role).toBe('officer');
      expect(result.user.did).toBe('did:example:789');
    });
  });
});