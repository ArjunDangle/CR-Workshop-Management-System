// src/modules/auth/LandingPage.tsx
import React from 'react';
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
  Wrench,
  FileText,
  AlertTriangle,
  UserCheck,
  Zap,
  ClipboardCheck,
  Map
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

// Module cards for Universal Gateway
const moduleCards = [
  {
    id: 'machines',
    title: 'Machines',
    description: 'Machine & Plant Assets',
    icon: Wrench,
    color: 'bg-blue-500',
    route: '/machines'
  },
  {
    id: 'permits',
    title: 'Permits',
    description: 'Work Permits Management',
    icon: FileText,
    color: 'bg-green-500',
    route: '/permits'
  },
  {
    id: 'incidents',
    title: 'Incidents',
    description: 'Safety Incident Reporting',
    icon: AlertTriangle,
    color: 'bg-red-500',
    route: '/incidents'
  },
  {
    id: 'contractors',
    title: 'Contractors',
    description: 'Contractor Management',
    icon: UserCheck,
    color: 'bg-purple-500',
    route: '/contractors'
  },
  {
    id: 'projects',
    title: 'Projects',
    description: 'Project Management',
    icon: Zap,
    color: 'bg-yellow-500',
    route: '/projects'
  },
  {
    id: 'power',
    title: 'Power',
    description: 'Power Systems',
    icon: Wrench,
    color: 'bg-orange-500',
    route: '/power'
  },
  {
    id: 'compliance',
    title: 'Compliance',
    description: 'Compliance Management',
    icon: ClipboardCheck,
    color: 'bg-indigo-500',
    route: '/compliance'
  },
  {
    id: 'mapping',
    title: 'Mapping',
    description: 'Location Mapping',
    icon: Map,
    color: 'bg-teal-500',
    route: '/mapping'
  }
];

type ViewMode = 'roles' | 'subclasses';

const LandingPage = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('gateway');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState<Subclass | null>(null);

  const handleModuleClick = (route: string) => {
    navigate(route);
  };

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
    setViewMode('gateway');
    setSelectedRole(null);
    setSelectedSubclass(null);
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

          {/* --- Universal Gateway View --- */}
          {viewMode === 'gateway' && (
            <>
              <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wider text-gray-900 mb-8 md:mb-12 leading-tight">
                Central Railway
                <br />
                Carriage Workshop
              </h1>

              <h2 className="text-xl md:text-2xl font-medium mb-8 md:mb-10 text-foreground">
                System Modules
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {moduleCards.map((module) => {
                  const IconComponent = module.icon;
                  return (
                    <Card
                      key={module.id}
                      onClick={() => handleModuleClick(module.route)}
                      className={cn(
                        "group p-4 md:p-6 h-32 md:h-36 cursor-pointer transition-all duration-200 ease-in-out",
                        "border-0 bg-white shadow-md hover:shadow-xl hover:-translate-y-2",
                        "flex flex-col items-center justify-center text-center"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-3 md:mb-4",
                        module.color,
                        "group-hover:scale-110 transition-transform duration-200"
                      )}>
                        <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-white" strokeWidth={2} />
                      </div>
                      <h3 className="font-semibold text-sm md:text-base text-center text-gray-800 leading-tight">
                        {module.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {module.description}
                      </p>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-8 md:mt-10">
                <Button
                  onClick={() => setViewMode('roles')}
                  variant="outline"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Select Role to Login
                </Button>
              </div>
            </>
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
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-10 md:mb-12 text-center">
                 {selectedRole.name}
              </h1>

              <h2 className="text-lg md:text-xl font-medium mb-5 md:mb-6 text-foreground text-center">
                Select your specific area
              </h2>

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