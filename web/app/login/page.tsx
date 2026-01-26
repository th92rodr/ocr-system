'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/auth-context';
import { login as log, register } from '@/lib/api/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'login' | 'register' | null>(null);

  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isEmailValid = isValidEmail(email);
  const isPasswordValid = isValidPassword(password)
  const isFormValid = isEmailValid && isPasswordValid;

  function isValidEmail(email: string): boolean {
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return EMAIL_REGEX.test(email);
  }

  function isValidPassword(password: string): boolean {
    return password.length >= 8 && password.length <= 32;
  }

  async function handleAuth(type: 'login' | 'register') {
    setError('');
    setLoading(type);

    try {
      if (type === 'login') {
        const { token } = await log(email, password);
        login(token);
      } else {
        const { token } = await register(email, password)
        login(token);
      }
      router.replace('/');

    } catch (error: any) {
      if (error?.message) {
        setError(error.message)
      } else {
        setError(type === 'login' ? 'Invalid email or password' : 'Failed to register user');
      }

    } finally {
      setLoading(null);
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-950 text-gray-100'>
      <div className='w-full max-w-sm bg-gray-900 rounded-lg shadow-lg p-6 animate-fade-in-up'>
        <h1 className='text-2xl font-semibold mb-6 text-center'>
          OCR System
        </h1>

        <div className='space-y-4'>
          <input type='email' name='email'
            placeholder='email'
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setEmailTouched(true)}
            className={`w-full px-3 py-2 rounded bg-gray-800 border focus:outline-none focus:ring transition
              ${emailTouched && !isEmailValid ? 'border-red-400 focus:ring-red-400' : 'border-gray-700 focus:ring-blue-500'}`}
          />

          {emailTouched && !isEmailValid && <p className='text-sm text-red-400'>Enter a valid email address</p>}

          <div className='relative'>
            <input type={showPassword ? 'text' : 'password'} name='password'
              placeholder='password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => setPasswordTouched(true)}
              className={`w-full px-3 py-2 rounded bg-gray-800 border focus:outline-none focus:ring transition pr-16
                ${passwordTouched && !isPasswordValid ? 'border-red-400 focus:ring-red-400' : 'border-gray-700 focus:ring-blue-500'}`}
            />

            <button type='button'
              onClick={() => setShowPassword((v) => !v)}
              className='absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-gray-200 transition cursor-pointer'>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {passwordTouched && !isPasswordValid && <p className='text-sm text-red-400'>Password must be 8–32 characters</p>}

          {error && <p className='text-sm text-red-500 animate-fade-in'>{error}</p>}

          <div className='flex gap-3 pt-2'>
            <button type='button'
              onClick={() => handleAuth('login')}
              disabled={!isFormValid || loading !== null}
              className='flex-1 py-2 rounded bg-blue-600 hover:bg-blue-500 transition active:scale-95 disabled:opacity-50 enabled:cursor-pointer disabled:cursor-not-allowed'>
              {loading === 'login' ? 'Logging in…' : 'Login'}
            </button>

            <button type='button'
              onClick={() => handleAuth('register')}
              disabled={!isFormValid || loading !== null}
              className='flex-1 py-2 rounded bg-gray-700 hover:bg-gray-600 transition active:scale-95 disabled:opacity-50 enabled:cursor-pointer disabled:cursor-not-allowed'>
              {loading === 'register' ? 'Registering…' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
