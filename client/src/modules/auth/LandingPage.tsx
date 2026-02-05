// src/modules/auth/LandingPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ROLES, Role, Subclass } from '@/config/roles';
import indianRailwayLogo from '@/assets/images/indian_railway_logo.png';
import { 
  HardHat, 
  Users, 
  ShieldCheck, 
  ArrowLeft,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper function to get an icon based on role ID
const getRoleIcon = (roleId: string) => {
  const className = cn("h-12 w-12 md:h-16 md:w-16 mb-3 md:mb-4 text-gray-700 group-hover:text-primary transition-colors duration-200");
  const strokeWidth = 2;
  switch (roleId) {
    case 'sse-maintenance':
      return <HardHat className={className} strokeWidth={strokeWidth} />;
    case 'sse-office':
      return <Users className={className} strokeWidth={strokeWidth} />;
    case 'safety-officer':
      return <ShieldCheck className={className} strokeWidth={strokeWidth} />;
    default:
      return null;
  }
};

type ViewMode = 'gateway' | 'roles' | 'subclasses';

const LandingPage = () => {
  const navigate = useNavigate();
  // We can default to 'gateway' for a splash screen or 'roles' for direct access.
  // Keeping 'gateway' but simplified for a cleaner look.
  const [viewMode, setViewMode] = useState<ViewMode>('gateway');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState<Subclass | null>(null);

  const handleRoleSelect = (roleId: string) => {
    const role = ROLES.find(r => r.id === roleId);
    if (role) {
      const hasSubclasses = !!(role.subclasses && role.subclasses.length > 0);

      if (hasSubclasses) {
        setSelectedRole(role);
        setSelectedSubclass(null);
        setViewMode('subclasses');
      } else {
        navigate('/login');
      }
    }
  };

  const handleSubclassSelect = (subclassId: string) => {
     const subclass = selectedRole?.subclasses?.find(sc => sc.id === subclassId);
     if (subclass) {
       setSelectedSubclass(subclass);
       navigate('/login');
     }
  };

  const handleBackToRoles = () => {
    if (viewMode === 'subclasses') {
        setViewMode('roles');
        setSelectedRole(null);
        setSelectedSubclass(null);
    } else if (viewMode === 'roles') {
        setViewMode('gateway');
    }
  };

return (
    <div className="flex flex-col lg:flex-row min-h-screen">

      {/* --- Left Column: White Background --- */}
      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center bg-background p-6 md:p-8 order-2 lg:order-1 flex-grow lg:flex-grow-0 relative">

         {/* --- Back Button (conditionally shown) --- */}
         {(viewMode === 'subclasses' || viewMode === 'roles') && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToRoles}
              className="absolute top-6 left-6 md:top-8 md:left-8 text-muted-foreground hover:text-foreground"
              aria-label="Back to gateway"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}

        <div className="w-full max-w-md md:max-w-lg text-center mt-auto mb-auto lg:mt-0 lg:mb-0">

          {/* --- Universal Gateway View (Simplified) --- */}
          {viewMode === 'gateway' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-wider text-gray-900 mb-6 leading-tight">
                Central Railway
                <br />
                <span className="text-primary">Carriage Workshop</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-12 max-w-sm mx-auto">
                Safety Management System (SMS) Portal
              </p>

              <div className="flex justify-center">
                <Button
                  onClick={() => setViewMode('roles')}
                  size="lg"
                  className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Enter Portal
                </Button>
              </div>
            </div>
          )}

          {/* --- Role Selection View --- */}
          {viewMode === 'roles' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-foreground">
                Select Your Role
              </h2>
              <p className="text-muted-foreground mb-10">Choose your department to proceed</p>
              
              <div className="flex flex-wrap justify-center gap-5 md:gap-6">
                {ROLES.map((role) => (
                  <Card
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={cn(
                      "group p-4 md:p-6 w-32 h-36 md:w-40 md:h-44 cursor-pointer transition-all duration-200 ease-in-out",
                      "border border-gray-200 bg-card hover:shadow-xl hover:border-primary/60 hover:-translate-y-1",
                      "flex flex-col items-center justify-center text-center"
                    )}
                  >
                    {getRoleIcon(role.id)}
                    <h3 className="font-semibold text-sm md:text-base text-center text-gray-800 leading-tight mt-2">{role.name}</h3>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* --- Subclass Selection View --- */}
          {viewMode === 'subclasses' && selectedRole?.subclasses && (
            <div className="w-full text-left transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-right-8">
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-2 text-center">
                 {selectedRole.name}
              </h1>
              <p className="text-center text-muted-foreground mb-10">Select your specific unit</p>

              <RadioGroup
                 onValueChange={handleSubclassSelect}
                 value={selectedSubclass?.id}
                 className="space-y-4 max-w-sm mx-auto"
              >
                {selectedRole.subclasses.map((subclass) => (
                  <Label
                    key={subclass.id}
                    htmlFor={subclass.id}
                    className={cn(
                      "flex items-center space-x-3 rounded-xl border-2 border-muted bg-white p-4 cursor-pointer transition-all hover:bg-gray-50 hover:border-primary/30",
                      "has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-blue-50/50 has-[[data-state=checked]]:shadow-md",
                       selectedSubclass?.id === subclass.id ? "border-primary bg-blue-50/50" : ""
                    )}
                  >
                    <RadioGroupItem value={subclass.id} id={subclass.id} />
                    <span className="text-base font-medium flex-1 ml-2">{subclass.name}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>
      </div>

      {/* --- Right Column: Specific Blue Background with Logo --- */}
      <div className="w-full lg:flex-1 bg-[#3838c8] flex items-center justify-center p-8 md:p-16 order-1 lg:order-2 min-h-[300px] lg:min-h-screen">
        <img
          src={indianRailwayLogo}
          alt="Indian Railways Logo"
          className="max-w-xs md:max-w-md lg:max-w-lg w-full h-auto drop-shadow-2xl"
        />
      </div>
    </div>
  );
};

export default LandingPage;