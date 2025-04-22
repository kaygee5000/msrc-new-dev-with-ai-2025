@echo off
REM This script updates all files that still use useAuth to use NextAuth instead in a Windows environment

ECHO Starting useAuth to NextAuth migration...

SET FILES=(
  "src\app\dashboard\profile\page.js"
  "src\app\rtp\school-output\[id]\page.js" 
  "src\app\rtp\profile\page.js"
  "src\app\rtp\partners-in-play\page.js"
  "src\app\rtp\partners-in-play\[id]\page.js"
  "src\app\rtp\district-output\[id]\page.js"
  "src\app\rtp\district-output\page.js"
  "src\app\rtp\consolidated-checklist\page.js"
  "src\app\rtp\consolidated-checklist\[id]\page.js"
  "src\app\rtp\consolidated-checklist\new\page.js"
  "src\app\reentry\profile\page.js"
  "src\app\reentry\page.js"
  "src\components\ReentryDashboard.js"
)

REM Install sed for Windows if not available
WHERE sed >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
  ECHO sed command not found. Please install GNU tools for Windows or manually update the files.
  PAUSE
  EXIT /B
)

FOR %%F IN %FILES% DO (
  IF EXIST "%%F" (
    ECHO Processing %%F
    
    REM Step 1: Replace the import statements
    sed -i "s/import { useAuth } from .*AuthProvider.*;/import { useSession, signOut } from \"next-auth\/react\";\nimport { useProgramContext } from \"@\/context\/ProgramContext\";/g" "%%F"
    sed -i "s/import { useAuth } from \"@\/components\/AuthProvider\";/import { useSession, signOut } from \"next-auth\/react\";\nimport { useProgramContext } from \"@\/context\/ProgramContext\";/g" "%%F"
    
    REM Step 2: Replace the basic useAuth destructuring pattern
    sed -i "s/const { user, isAuthenticated, isLoading } = useAuth();/const { data: session, status } = useSession();\nconst { currentProgram } = useProgramContext();\nconst user = session?.user;\nconst isAuthenticated = status === \"authenticated\";\nconst isLoading = status === \"loading\";/g" "%%F"
    
    REM Step 3: Replace the RTP-specific useAuth destructuring pattern
    sed -i "s/const { user, isAuthenticated, isLoading, isRtpAuthorized } = useAuth();/const { data: session, status } = useSession();\nconst { currentProgram } = useProgramContext();\nconst user = session?.user;\nconst isAuthenticated = status === \"authenticated\";\nconst isLoading = status === \"loading\";\nconst isRtpAuthorized = user?.programRoles?.some(pr => pr.program_code === \"rtp\") || false;/g" "%%F"
    
    REM Step 4: Replace the Reentry-specific useAuth destructuring pattern
    sed -i "s/const { user, isAuthenticated, isLoading, isDataCollector, isReentryAuthorized } = useAuth();/const { data: session, status } = useSession();\nconst { currentProgram } = useProgramContext();\nconst user = session?.user;\nconst isAuthenticated = status === \"authenticated\";\nconst isLoading = status === \"loading\";\nconst isDataCollector = user?.role === \"data_collector\" || false;\nconst isReentryAuthorized = user?.programRoles?.some(pr => pr.program_code === \"reentry\") || false;/g" "%%F"
    
    REM Step 5: Replace just signOut from useAuth - fixed to use a different pattern
    sed -i "s/const { signOut } = useAuth();/const { signOut } = useSession();/g" "%%F"
    
    ECHO Updated %%F
  ) ELSE (
    ECHO File not found: %%F
  )
)

ECHO All files updated!
PAUSE