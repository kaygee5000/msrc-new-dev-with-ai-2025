// Mock data for dashboard to use when API calls fail
export const mockDashboardData = {
  counts: {
    regions: 16,
    districts: 260,
    circuits: 987,
    schools: 3458
  },
  latestSubmissions: [
    {
      id: 1,
      school_id: 1,
      school_name: "Accra Academy",
      district_name: "Accra Metro",
      region_name: "Greater Accra",
      week: 3,
      term: 2,
      boys_enrollment: 342,
      girls_enrollment: 298,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      school_id: 2,
      school_name: "Wesley Girls High School",
      district_name: "Cape Coast Metro",
      region_name: "Central",
      week: 3,
      term: 2,
      boys_enrollment: 0,
      girls_enrollment: 587,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      school_id: 3,
      school_name: "Prempeh College",
      district_name: "Kumasi Metro",
      region_name: "Ashanti",
      week: 3,
      term: 2,
      boys_enrollment: 452,
      girls_enrollment: 0,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      school_id: 4,
      school_name: "Tamale Senior High",
      district_name: "Tamale Metro",
      region_name: "Northern",
      week: 3,
      term: 2,
      boys_enrollment: 378,
      girls_enrollment: 342,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      school_id: 5,
      school_name: "Mfantsipim School",
      district_name: "Cape Coast Metro",
      region_name: "Central",
      week: 3,
      term: 2,
      boys_enrollment: 524,
      girls_enrollment: 0,
      created_at: new Date().toISOString()
    }
  ],
  activityLogs: [
    {
      id: 1,
      user_id: 1,
      user_name: "John Doe",
      role: "admin",
      action: "LOGIN",
      description: "Admin user logged in",
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 2,
      user_name: "Jane Smith",
      role: "regional",
      action: "REPORT_SUBMISSION",
      description: "Submitted weekly report for Greater Accra",
      created_at: new Date().toISOString()
    }
  ],
  stats: {
    enrollment: {
      total_boys: 8243,
      total_girls: 7845,
      total_enrollment: 16088
    },
    attendance: {
      avg_boys_attendance: 87.5,
      avg_girls_attendance: 89.2,
      avg_attendance: 88.3
    },
    facilitator: {
      avg_facilitator_attendance: 92.7,
      avg_facilitator_punctuality: 90.2
    }
  }
};

export const mockUserStats = {
  weekly: {
    total_submissions: 347,
    total_boys: 8243,
    total_girls: 7845,
    avg_boys_attendance: 87.5,
    avg_girls_attendance: 89.2,
    avg_facilitator_attendance: 92.7,
    avg_facilitator_punctuality: 90.2
  },
  termly: {
    total_submissions: 124,
    avg_management_score: 78.5,
    avg_grounds_score: 82.3,
    avg_community_score: 75.8
  },
  activities: [
    {
      id: 1,
      user_id: 1,
      user_name: "John Doe",
      role: "admin",
      action: "LOGIN",
      description: "Admin user logged in",
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 2,
      user_name: "Jane Smith",
      role: "regional",
      action: "REPORT_SUBMISSION",
      description: "Submitted weekly report for Greater Accra",
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      user_id: 3,
      user_name: "Emmanuel Kwakye",
      role: "district",
      action: "DATA_UPDATE",
      description: "Updated school information for Kumasi Metro",
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      user_id: 4,
      user_name: "Fatima Hassan",
      role: "school",
      action: "REPORT_SUBMISSION",
      description: "Submitted weekly attendance report",
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      user_id: 5,
      user_name: "George Mensah",
      role: "district",
      action: "USER_CREATION",
      description: "Added new school user account",
      created_at: new Date().toISOString()
    }
  ]
};