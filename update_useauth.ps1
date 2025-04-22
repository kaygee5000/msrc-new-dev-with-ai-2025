# PowerShell script to replace useAuth with NextAuth hooks
# Save this as update_useauth.ps1 and run it with PowerShell

Write-Host "Starting useAuth to NextAuth migration..."

$files = @(
  "src\app\dashboard\profile\page.js",
  "src\app\rtp\school-output\[id]\page.js", 
  "src\app\rtp\profile\page.js",
  "src\app\rtp\partners-in-play\page.js",
  "src\app\rtp\partners-in-play\[id]\page.js",
  "src\app\rtp\district-output\[id]\page.js",
  "src\app\rtp\district-output\page.js",
  "src\app\rtp\consolidated-checklist\page.js",
  "src\app\rtp\consolidated-checklist\[id]\page.js",
  "src\app\rtp\consolidated-checklist\new\page.js",
  "src\app\reentry\profile\page.js",
  "src\app\reentry\page.js",
  "src\components\ReentryDashboard.js"
)

foreach ($file in $files) {
  if (Test-Path $file) {
    Write-Host "Processing $file"
    
    # Read the file content
    $content = Get-Content -Path $file -Raw
    
    # Step 1: Replace the import statements
    $content = $content -replace 'import \{ useAuth \} from ".*AuthProvider.*";', 'import { useSession, signOut } from "next-auth/react";
import { useProgramContext } from "@/context/ProgramContext";'
    
    $content = $content -replace 'import \{ useAuth \} from "@/components/AuthProvider";', 'import { useSession, signOut } from "next-auth/react";
import { useProgramContext } from "@/context/ProgramContext";'
    
    # Step 2: Replace the basic useAuth destructuring pattern
    $content = $content -replace 'const \{ user, isAuthenticated, isLoading \} = useAuth\(\);', 'const { data: session, status } = useSession();
const { currentProgram } = useProgramContext();
const user = session?.user;
const isAuthenticated = status === "authenticated";
const isLoading = status === "loading";'
    
    # Step 3: Replace the RTP-specific useAuth destructuring pattern
    $content = $content -replace 'const \{ user, isAuthenticated, isLoading, isRtpAuthorized \} = useAuth\(\);', 'const { data: session, status } = useSession();
const { currentProgram } = useProgramContext();
const user = session?.user;
const isAuthenticated = status === "authenticated";
const isLoading = status === "loading";
const isRtpAuthorized = user?.programRoles?.some(pr => pr.program_code === "rtp") || false;'
    
    # Step 4: Replace the Reentry-specific useAuth destructuring pattern
    $content = $content -replace 'const \{ user, isAuthenticated, isLoading, isDataCollector, isReentryAuthorized \} = useAuth\(\);', 'const { data: session, status } = useSession();
const { currentProgram } = useProgramContext();
const user = session?.user;
const isAuthenticated = status === "authenticated";
const isLoading = status === "loading";
const isDataCollector = user?.role === "data_collector" || false;
const isReentryAuthorized = user?.programRoles?.some(pr => pr.program_code === "reentry") || false;'
    
    # Step 5: Replace just signOut from useAuth
    $content = $content -replace 'const \{ signOut \} = useAuth\(\);', 'const { signOut } = useSession();'
    
    # Write the updated content back to the file
    Set-Content -Path $file -Value $content
    
    Write-Host "Updated $file"
  }
  else {
    Write-Host "File not found: $file"
  }
}

Write-Host "All files updated!"
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")