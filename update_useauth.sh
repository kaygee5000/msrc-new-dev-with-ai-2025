#!/bin/bash

# This script updates all files that still use useAuth to use NextAuth instead

FILES=(
  "src/app/dashboard/profile/page.js"
  "src/app/rtp/school-output/[id]/page.js" 
  "src/app/rtp/profile/page.js"
  "src/app/rtp/partners-in-play/page.js"
  "src/app/rtp/partners-in-play/[id]/page.js"
  "src/app/rtp/district-output/[id]/page.js"
  "src/app/rtp/district-output/page.js"
  "src/app/rtp/consolidated-checklist/page.js"
  "src/app/rtp/consolidated-checklist/[id]/page.js"
  "src/app/rtp/consolidated-checklist/new/page.js"
  "src/app/reentry/profile/page.js"
  "src/app/reentry/page.js"
  "src/components/ReentryDashboard.js"
)

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "Processing $FILE"
    
    # Step 1: Replace the import statements
    sed -i 's/import { useAuth } from ".*AuthProvider.*";/import { useSession, signOut } from "next-auth\/react";\nimport { useProgramContext } from "@\/context\/ProgramContext";/g' "$FILE"
    sed -i 's/import { useAuth } from "@\/components\/AuthProvider";/import { useSession, signOut } from "next-auth\/react";\nimport { useProgramContext } from "@\/context\/ProgramContext";/g' "$FILE"
    
    # Step 2: Replace the basic useAuth destructuring pattern
    sed -i 's/const { user, isAuthenticated, isLoading } = useAuth();/const { data: session, status } = useSession();\nconst { currentProgram } = useProgramContext();\nconst user = session?.user;\nconst isAuthenticated = status === "authenticated";\nconst isLoading = status === "loading";/g' "$FILE"
    
    # Step 3: Replace the RTP-specific useAuth destructuring pattern
    sed -i 's/const { user, isAuthenticated, isLoading, isRtpAuthorized } = useAuth();/const { data: session, status } = useSession();\nconst { currentProgram } = useProgramContext();\nconst user = session?.user;\nconst isAuthenticated = status === "authenticated";\nconst isLoading = status === "loading";\nconst isRtpAuthorized = user?.programRoles?.some(pr => pr.program_code === "rtp") || false;/g' "$FILE"
    
    # Step 4: Replace the Reentry-specific useAuth destructuring pattern
    sed -i 's/const { user, isAuthenticated, isLoading, isDataCollector, isReentryAuthorized } = useAuth();/const { data: session, status } = useSession();\nconst { currentProgram } = useProgramContext();\nconst user = session?.user;\nconst isAuthenticated = status === "authenticated";\nconst isLoading = status === "loading";\nconst isDataCollector = user?.role === "data_collector" || false;\nconst isReentryAuthorized = user?.programRoles?.some(pr => pr.program_code === "reentry") || false;/g' "$FILE"
    
    # Step 5: Replace just signOut from useAuth
    sed -i 's/const { signOut } = useAuth();/import { signOut } from "next-auth\/react";/g' "$FILE"
    
    echo "Updated $FILE"
  else
    echo "File not found: $FILE"
  fi
done

echo "All files updated!"