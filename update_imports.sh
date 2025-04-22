#!/bin/bash

# This script will update files that were importing from AuthProvider to use NextAuth's useSession
# and/or our new useProgramContext hook instead

FILES="src/app/dashboard/layout.js
src/app/dashboard/profile/page.js
src/app/dashboard/settings/page.js
src/app/reentry/page.js
src/app/reentry/profile/page.js
src/app/rtp/consolidated-checklist/new/page.js
src/app/rtp/consolidated-checklist/page.js
src/app/rtp/consolidated-checklist/[id]/page.js
src/app/rtp/district-output/page.js
src/app/rtp/district-output/[id]/page.js
src/app/rtp/page.js
src/app/rtp/partners-in-play/page.js
src/app/rtp/partners-in-play/[id]/page.js
src/app/rtp/profile/page.js
src/components/ReentryDashboard.js"

for FILE in $FILES; do
  # Skip if file doesn't exist
  if [ ! -f "$FILE" ]; then
    echo "Skipping $FILE (not found)"
    continue
  fi
  
  echo "Processing $FILE"
  
  # Replace import from AuthProvider with import from next-auth/react and ProgramContext
  sed -i 's/import { useAuth } from .@\/components\/AuthProvider.;/import { useSession } from "next-auth\/react";\nimport { useProgramContext } from "@\/context\/ProgramContext";/g' "$FILE"
  
  # Replace useAuth() usage with useSession() and useProgramContext()
  sed -i 's/const { user, loading } = useAuth();/const { data: session, status } = useSession();\nconst { currentProgram } = useProgramContext();\nconst user = session?.user;\nconst loading = status === "loading";/g' "$FILE"
  sed -i 's/const { user } = useAuth();/const { data: session } = useSession();\nconst { currentProgram } = useProgramContext();\nconst user = session?.user;/g' "$FILE"
  
  echo "Updated $FILE"
done

echo "Import updates complete!"
