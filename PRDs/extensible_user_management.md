# PRD: Extensible User Management System

## Purpose
Create a flexible, scalable user management system that allows users to have multiple program assignments with different roles across the MSRC platform. This will enable the system to accommodate new programs without requiring code changes to the user management interface.

## Background
The current system has hardcoded user types like `rtp_admin` and `rtp_collector` which doesn't scale well as new programs are added. Users should be able to:
- Belong to multiple programs simultaneously
- Have different roles in different programs
- Be granted program access without requiring code changes

## Database Design

### 1. Programs Table
Stores information about available programs in the system.

```sql
CREATE TABLE programs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. User Program Roles Table
Junction table that manages the many-to-many relationship between users and programs, with role information.

```sql
CREATE TABLE user_program_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  program_id INT NOT NULL,
  role VARCHAR(50) NOT NULL,
  scope_type VARCHAR(50),
  scope_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  UNIQUE KEY (user_id, program_id, role)
);
```

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create database migration for `programs` table
- [ ] Create database migration for `user_program_roles` table
- [ ] Populate `programs` table with initial data:
  - Core MSRC System (code: 'core')
  - Reentry Program (code: 'reentry')
  - Right to Play (code: 'rtp')
- [ ] Create migration script to convert existing users to the new structure

### Phase 2: Backend API Changes
- [ ] Create API endpoint to list available programs
- [ ] Modify user creation/update API to handle program role assignments
- [ ] Enhance user retrieval API to include program assignments
- [ ] Add API for managing user program roles (add/remove/update)
- [ ] Update authentication endpoint to include program access in JWT/session data

### Phase 3: Frontend User Interface
- [ ] Update user form in admin dashboard to support multiple program assignments
- [ ] Add a tab-based interface for:
  - Basic user information
  - Program access management
  - Permissions
- [ ] Create interface for adding/editing program roles with proper scope selection
- [ ] Update user listing to show program assignments

### Phase 4: Authorization Logic
- [ ] Modify `AuthProvider` to handle program-based permissions
- [ ] Update route guards to check for program-specific access
- [ ] Add utility functions for checking program access:
  - `hasProgramAccess(programCode)`
  - `hasProgramRole(programCode, role)`
- [ ] Update existing RTP and Reentry authorization checks to use the new model

### Phase 5: Testing and Migration
- [ ] Test all program role assignment features
- [ ] Verify existing users maintain their access
- [ ] Create comprehensive test cases for multi-program users
- [ ] Deploy database changes first, then code changes
- [ ] Monitor system for authorization issues after deployment

## Acceptance Criteria

1. **Database Structure**
   - Programs table exists with proper columns
   - User program roles table exists with proper relationships
   - Initial programs are populated

2. **User Management**
   - Admins can assign users to multiple programs
   - Admins can set different roles for each program
   - Admins can configure scope (region/district/school) per program assignment

3. **Authorization**
   - Users only have access to programs they're assigned to
   - Users have the appropriate level of access based on their role in each program
   - Program-specific routes are properly protected

4. **UI/UX**
   - User management interface is intuitive for program assignments
   - Program role management doesn't add significant complexity to user creation

5. **Extensibility**
   - New programs can be added to the system without code changes
   - Users can be given access to new programs immediately after program creation

## Future Considerations
- Role hierarchies within programs
- Program-specific permissions beyond simple role assignments
- Group-based program assignments
- Self-service program registration
