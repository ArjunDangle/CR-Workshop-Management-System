// src/modules/auth/LandingPage.tsx
import React, { useState } from 'react'; // Added useState back
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Import Button for Back button
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Keep for subclass selection
import { Label } from '@/components/ui/label'; // Keep for subclass selection
import { ROLES, Role, Subclass } from '@/config/roles'; // Need Subclass again
import indianRailwayLogo from '@/assets/images/indian_railway_logo.png';
import { HardHat, Users, ShieldCheck, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
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

type ViewMode = 'roles' | 'subclasses';

const LandingPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('roles');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null); // To store the parent role when showing subclasses
  const [selectedSubclass, setSelectedSubclass] = useState<Subclass | null>(null); // Keep track of selected subclass

  const handleRoleSelect = (roleId: string) => {
    const role = ROLES.find(r => r.id === roleId);
    if (role) {
      const hasSubclasses = !!(role.subclasses && role.subclasses.length > 0);

      if (hasSubclasses) {
        setSelectedRole(role); // Store the selected parent role
        setSelectedSubclass(null); // Clear any previous subclass selection
        setViewMode('subclasses'); // Switch view
      } else {
        // Navigate immediately if there are no subclasses
        navigate('/login');
      }
    }
  };

  const handleSubclassSelect = (subclassId: string) => {
     const subclass = selectedRole?.subclasses?.find(sc => sc.id === subclassId);
     if (subclass) {
       setSelectedSubclass(subclass); // Update state (optional, could navigate directly)
       // Navigate immediately after selecting a subclass
       navigate('/login');
     }
  };

  const handleBackToRoles = () => {
    setViewMode('roles');
    setSelectedRole(null);
    setSelectedSubclass(null);
  };


  return (
    <div className="flex flex-col lg:flex-row min-h-screen">

      {/* --- Left Column: White Background --- */}
      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center bg-background p-6 md:p-8 order-2 lg:order-1 flex-grow lg:flex-grow-0 relative">

         {/* --- Back Button (conditionally shown) --- */}
         {viewMode === 'subclasses' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToRoles}
              className="absolute top-6 left-6 md:top-8 md:left-8 text-muted-foreground hover:text-foreground"
              aria-label="Back to role selection"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}


        <div className="w-full max-w-md md:max-w-lg text-center mt-auto mb-auto lg:mt-0 lg:mb-0">

          {/* --- Main Title --- */}
          {/* Show title only when selecting roles */}
          {viewMode === 'roles' && (
             <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wider text-gray-900 mb-16 md:mb-20 leading-tight">
               Central Railway
               <br />
               Carriage Workshop
             </h1>
          )}


          {/* --- Role Selection View --- */}
          {viewMode === 'roles' && (
            <>
              <h2 className="text-xl md:text-2xl font-medium mb-10 md:mb-12 text-foreground">
                Select your role
              </h2>
              <div className="flex flex-wrap justify-center gap-5 md:gap-6">
                {ROLES.map((role) => (
                  <Card
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={cn(
                      "group p-4 md:p-6 w-32 h-36 md:w-36 md:h-40 cursor-pointer transition-all duration-200 ease-in-out",
                      "border border-gray-300 bg-card hover:shadow-lg hover:border-primary/60 hover:-translate-y-1",
                      "flex flex-col items-center justify-center text-center"
                    )}
                  >
                    {getRoleIcon(role.id)}
                    <h3 className="font-semibold text-sm md:text-base text-center text-gray-800 leading-tight">{role.name}</h3>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* --- Subclass Selection View --- */}
          {viewMode === 'subclasses' && selectedRole?.subclasses && (
            <div className="w-full text-left transition-all duration-300 ease-in-out animate-in fade-in">
              {/* Show Parent Role as Title */}
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-10 md:mb-12 text-center">
                 {selectedRole.name}
              </h1>

              <h2 className="text-lg md:text-xl font-medium mb-5 md:mb-6 text-foreground text-center">
                Select your specific area
              </h2>

              <RadioGroup
                 onValueChange={handleSubclassSelect}
                 value={selectedSubclass?.id}
                 className="space-y-4 max-w-sm mx-auto" // Center the radio group
              >
                {selectedRole.subclasses.map((subclass) => (
                  <Label
                    key={subclass.id}
                    htmlFor={subclass.id}
                    className={cn(
                      "flex items-center space-x-3 rounded-md border border-muted bg-transparent p-4 cursor-pointer transition-colors hover:bg-muted/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=checked]]:shadow-sm",
                       selectedSubclass?.id === subclass.id ? "border-primary bg-primary/5" : ""
                    )}
                  >
                    <RadioGroupItem value={subclass.id} id={subclass.id} />
                    <span className="text-base flex-1">{subclass.name}</span>
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
          className="max-w-xs md:max-w-md lg:max-w-lg w-full h-auto"
        />
      </div>
    </div>
  );
};

export default LandingPage;