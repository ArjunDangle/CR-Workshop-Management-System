// src/modules/auth/components/LoginForm.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loginUser } from '../authApi';
import { useAuthStore } from '../authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').min(1, 'Email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            // --- FIX: Use data.access_token ---
            // Also, pass null for user as /token doesn't return it
            login(null, data.access_token);
            // --- END FIX ---
            navigate('/dashboard');
        },
    });

  const onSubmit = (data: LoginFormData) => {
    mutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {mutation.isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription className="text-left text-base">
            {mutation.error instanceof Error ? mutation.error.message : 'An error occurred. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* ... rest of the form fields ... */}
       <div className="space-y-2">
        <Label htmlFor="email" className="text-left block font-semibold text-base">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          className="w-full h-11 text-base"
          {...register('email')}
          disabled={mutation.isPending}
        />
        {errors.email && (
          <p className="text-base text-destructive text-left mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-left block font-semibold text-base">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            className="w-full h-11 text-base pr-12"
            {...register('password')}
            disabled={mutation.isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            disabled={mutation.isPending}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-base text-destructive text-left mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-lg font-semibold"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>

      <div className="mt-8 text-base text-muted-foreground text-left">
        <a href="#" className="hover:text-primary transition-colors">
          Forgot your password?
        </a>
      </div>
    </form>
  );
};