// src/modules/auth/LoginPage.tsx
import { LoginForm } from "./components/LoginForm"; // Ensure this uses named import
import indianRailwayLogo from '@/assets/images/indian_railway_logo.png';

const LoginPage = () => {
  return (
    <div className="flex min-h-screen">
      {/* Left Column: Sign In Form */}
      {/* Increased padding slightly */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center bg-background p-8 lg:p-20">
        <div className="w-full max-w-md mx-auto">
          

          {/* Sign In Heading - Increased size */}
          <h1 className="text-4xl lg:text-5xl font-light leading-tight mb-5 text-left"> {/* Increased size */}
            Sign in
          </h1>
          {/* Increased size and margin */}
          <p className="text-lg text-muted-foreground mb-10 text-left"> {/* Increased size */}
            Access your Railway Workshop Management System
          </p>

          {/* Login Form Component */}
          <LoginForm />
        </div>
      </div>

      {/* --- Right Column: Indian Railway Logo with Blue Background --- */}
      <div className="hidden lg:flex lg:flex-1 bg-[#3838c8] items-center justify-center p-16">
        <img
          src={indianRailwayLogo}
          alt="Indian Railways Logo"
          className="max-w-lg w-full h-auto"
        />
      </div>
    </div>
  );
};

export default LoginPage;