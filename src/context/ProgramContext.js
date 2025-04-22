"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProgramSelector from '../components/ProgramSelector';
import { usePathname } from 'next/navigation';

const ProgramContext = createContext(null);

export function ProgramProvider({ children }) {
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [currentProgram, setCurrentProgram] = useState(null);
  const pathname = usePathname();
  
  // Use NextAuth session
  const { data: session, status } = useSession();
  const loading = status === "loading";
  
  useEffect(() => {
    // Skip if no session or still loading
    if (!session || loading) return;
    
    const checkProgramRoles = () => {
      try {
        // Check if user has program roles
        if (session.user.programRoles && session.user.programRoles.length > 0) {
          // If user has multiple program roles, check if a current program is selected
          const storedProgram = localStorage.getItem('msrc_current_program');
          
          if (storedProgram) {
            setCurrentProgram(JSON.parse(storedProgram));
          } else if (session.user.programRoles.length > 1 && !isPublicRoute(pathname)) {
            // If multiple programs and no selection yet, show selector
            setShowProgramSelector(true);
          } else if (session.user.programRoles.length === 1) {
            // If only one program, set it as current
            const program = {
              id: session.user.programRoles[0].program_id,
              name: session.user.programRoles[0].program_name,
              code: session.user.programRoles[0].program_code,
              roles: [session.user.programRoles[0]]
            };
            setCurrentProgram(program);
            localStorage.setItem('msrc_current_program', JSON.stringify(program));
          }
        }
      } catch (error) {
        console.error('Error handling program roles:', error);
      }
    };
    
    checkProgramRoles();
  }, [session, loading, pathname]);
  
  // Helper function to determine if a route is public
  const isPublicRoute = (path) => {
    const publicRoutes = ['/login', '/register', '/reset-password', '/about', '/contact'];
    return publicRoutes.some(route => path === route || path.startsWith(route + '/'));
  };
  
  // Handle program selection
  const handleProgramSelect = (program) => {
    setCurrentProgram(program);
    setShowProgramSelector(false);
    localStorage.setItem('msrc_current_program', JSON.stringify(program));
  };
  
  // Check if user has a specific program role
  const hasProgramRole = (programCode, role) => {
    if (!session?.user?.programRoles) return false;
    
    return session.user.programRoles.some(
      pr => pr.program_code === programCode && pr.role === role
    );
  };
  
  // Check if current program has a role
  const currentProgramHasRole = (role) => {
    if (!currentProgram || !currentProgram.roles) return false;
    return currentProgram.roles.some(r => r.role === role);
  };
  
  return (
    <ProgramContext.Provider 
      value={{ 
        user: session?.user,
        loading,
        currentProgram,
        hasProgramRole,
        currentProgramHasRole
      }}
    >
      {children}
      
      {/* Program Selector Modal */}
      <ProgramSelector 
        open={showProgramSelector} 
        onClose={() => setShowProgramSelector(false)}
        onSelect={handleProgramSelect} 
      />
    </ProgramContext.Provider>
  );
}

// Custom hook for accessing program context
export const useProgramContext = () => useContext(ProgramContext);