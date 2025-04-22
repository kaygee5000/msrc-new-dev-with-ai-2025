'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  BarChart as BarChartIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { formatDate } from '@/utils/dates';
import dynamic from 'next/dynamic';

// Dynamically import Charts to avoid SSR issues
const Charts = dynamic(() => import('@/components/Charts'), { ssr: false });

/**
 * Displays detailed breakdown of an outcome indicator calculation
 * 
 * @param {Object} props - Component props
 * @param {String} props.indicatorType - Type of indicator ('implementationPlans', 'teacherSkills', etc.)
 * @param {Object} props.indicatorData - The calculated indicator data with details
 * @param {Array} props.historicalData - Historical data for comparison (optional)
 * @param {Array} props.districtBreakdown - District-level breakdown (optional)
 * @returns {React.Component} - Indicator breakdown component
 */
export default function IndicatorBreakdown({ 
  indicatorType, 
  indicatorData, 
  historicalData = [],
  districtBreakdown = [] 
}) {
  const [activeTab, setActiveTab] = useState(0);

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!indicatorData) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1">
          No data available for this indicator.
        </Typography>
      </Paper>
    );
  }

  const getIndicatorTitle = () => {
    switch (indicatorType) {
      case 'implementationPlans':
        return 'Schools with Implementation Plans';
      case 'developmentPlans':
        return 'Schools with LtP Development Plans';
      case 'lessonPlans':
        return 'Teachers with LtP Lesson Plans';
      case 'learningEnvironments':
        return 'Learning Environments with LtP Methods';
      case 'teacherSkills':
        return 'Teachers with LtP Facilitation Skills';
      case 'enrollment':
        return 'Total Primary Enrollment';
      case 'schoolsReached':
        return 'Schools Reached';
      default:
        return 'Indicator Details';
    }
  };

  const getFormulaDescription = () => {
    switch (indicatorType) {
      case 'implementationPlans':
        return '(Number of YES responses to Q17 / Total responses) × 100';
      case 'developmentPlans':
        return '(Number of schools with uploaded plans for Q18 / Total schools) × 100';
      case 'lessonPlans':
        return '(Number of YES responses to Q19 / Total responses) × 100';
      case 'learningEnvironments':
        return `Weighted average of "friendly tone" (30%), "acknowledging effort" (30%), and "pupil participation" (40%) scores.
                Schools scoring above 3.5/5 are considered to be using LtP methods.`;
      case 'teacherSkills':
        return `Average score across 10 teacher skill questions (Q29, Q30, Q31, Q32, Q33, Q39, Q45, Q46, Q48, Q49).
                Teachers scoring above 3.5/5 are considered to have LtP facilitation skills.`;
      case 'enrollment':
        return 'Sum of boys enrolled (Q12) and girls enrolled (Q13) across all schools';
      case 'schoolsReached':
        return 'Count of unique schools with any submission';
      default:
        return 'No formula description available';
    }
  };

  // Generate chart data for historical trends
  const getHistoricalChartData = () => {
    if (!historicalData || historicalData.length === 0) {
      return {
        options: {
          chart: { type: 'line' },
          xaxis: { categories: ['No data'] },
          title: { text: 'No historical data available' }
        },
        series: [{ name: 'Value', data: [0] }]
      };
    }

    const categories = historicalData.map(item => 
      item.itineraryName || `Itinerary ${item.itineraryId}`
    );

    const seriesData = historicalData.map(item => {
      switch (indicatorType) {
        case 'implementationPlans':
        case 'developmentPlans':
        case 'lessonPlans':
        case 'learningEnvironments':
        case 'teacherSkills':
          return item.percentage || 0;
        case 'enrollment':
          return item.totalEnrollment || 0;
        case 'schoolsReached':
          return item.schoolsReached || 0;
        default:
          return 0;
      }
    });

    return {
      options: {
        chart: { type: 'line' },
        xaxis: { categories },
        yaxis: { 
          title: { text: getYAxisTitle() },
          min: 0,
          max: getYAxisMax()
        },
        title: { 
          text: `${getIndicatorTitle()} - Historical Trend`,
          align: 'left'
        },
        markers: { size: 5 },
        stroke: { width: 3, curve: 'smooth' }
      },
      series: [{ name: getIndicatorTitle(), data: seriesData }]
    };
  };

  // Generate chart data for district comparison
  const getDistrictChartData = () => {
    if (!districtBreakdown || districtBreakdown.length === 0) {
      return {
        options: {
          chart: { type: 'bar' },
          xaxis: { categories: ['No data'] },
          title: { text: 'No district data available' }
        },
        series: [{ name: 'Value', data: [0] }]
      };
    }

    // Sort districts by percentage in descending order
    const sortedDistricts = [...districtBreakdown].sort((a, b) => {
      const valueA = getDistrictValue(a);
      const valueB = getDistrictValue(b);
      return valueB - valueA;
    });

    const categories = sortedDistricts.map(item => item.districtName || `District ${item.districtId}`);
    const seriesData = sortedDistricts.map(getDistrictValue);

    return {
      options: {
        chart: { type: 'bar' },
        plotOptions: {
          bar: { horizontal: false, columnWidth: '55%', distributed: false }
        },
        dataLabels: { enabled: false },
        xaxis: { 
          categories,
          title: { text: 'Districts' }
        },
        yaxis: { 
          title: { text: getYAxisTitle() },
          min: 0,
          max: getYAxisMax()
        },
        title: { 
          text: `${getIndicatorTitle()} - District Comparison`,
          align: 'left'
        },
        colors: ['#33b2df', '#546E7A', '#d4526e', '#13d8aa', '#A5978B']
      },
      series: [{ name: getIndicatorTitle(), data: seriesData }]
    };
  };

  const getDistrictValue = (district) => {
    switch (indicatorType) {
      case 'implementationPlans':
      case 'developmentPlans':
      case 'lessonPlans':
      case 'learningEnvironments':
      case 'teacherSkills':
        return district.percentage || 0;
      case 'enrollment':
        return district.totalEnrollment || 0;
      case 'schoolsReached':
        return district.schoolsReached || 0;
      default:
        return 0;
    }
  };

  const getYAxisTitle = () => {
    switch (indicatorType) {
      case 'implementationPlans':
      case 'developmentPlans':
      case 'lessonPlans':
      case 'learningEnvironments':
      case 'teacherSkills':
        return 'Percentage (%)';
      case 'enrollment':
        return 'Students Enrolled';
      case 'schoolsReached':
        return 'Number of Schools';
      default:
        return 'Value';
    }
  };

  const getYAxisMax = () => {
    switch (indicatorType) {
      case 'implementationPlans':
      case 'developmentPlans':
      case 'lessonPlans':
      case 'learningEnvironments':
      case 'teacherSkills':
        return 100;
      default:
        return undefined; // Auto scale
    }
  };

  // Determine which raw data table to show based on indicator type
  const renderRawDataTable = () => {
    switch (indicatorType) {
      case 'implementationPlans':
      case 'developmentPlans':
      case 'lessonPlans':
        return renderSimpleResponseTable();
      case 'learningEnvironments':
        return renderLearningEnvironmentsTable();
      case 'teacherSkills':
        return renderTeacherSkillsTable();
      case 'enrollment':
        return renderEnrollmentTable();
      case 'schoolsReached':
        return renderSchoolsReachedTable();
      default:
        return (
          <Typography variant="body1">
            No detailed data available for this indicator.
          </Typography>
        );
    }
  };

  const renderSimpleResponseTable = () => {
    const getData = () => {
      if (indicatorType === 'implementationPlans') {
        return {
          positiveCount: indicatorData.schoolsWithPlans,
          totalCount: indicatorData.totalSchools,
          fieldLabel: 'Schools with Plans'
        };
      } else if (indicatorType === 'developmentPlans') {
        return {
          positiveCount: indicatorData.schoolsWithUploads,
          totalCount: indicatorData.totalSchools,
          fieldLabel: 'Schools with Uploads'
        };
      } else if (indicatorType === 'lessonPlans') {
        return {
          positiveCount: indicatorData.teachersWithLtPPlans,
          totalCount: indicatorData.totalTeachers,
          fieldLabel: 'Teachers with LtP Plans'
        };
      }
      return { positiveCount: 0, totalCount: 0, fieldLabel: 'Count' };
    };

    const { positiveCount, totalCount, fieldLabel } = getData();

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Metric</TableCell>
              <TableCell align="right">Count</TableCell>
              <TableCell align="right">Percentage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{fieldLabel}</TableCell>
              <TableCell align="right">{positiveCount}</TableCell>
              <TableCell align="right">
                {(totalCount > 0 ? (positiveCount / totalCount) * 100 : 0).toFixed(2)}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell align="right">{totalCount}</TableCell>
              <TableCell align="right">100%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderLearningEnvironmentsTable = () => {
    if (!indicatorData.detailedScores || indicatorData.detailedScores.length === 0) {
      return (
        <Typography variant="body1">
          No detailed learning environment data available.
        </Typography>
      );
    }

    // Sort by weighted score in descending order
    const sortedScores = [...indicatorData.detailedScores]
      .sort((a, b) => b.weightedScore - a.weightedScore);

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>School</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell align="right">Friendly Tone Score</TableCell>
              <TableCell align="right">Acknowledging Effort Score</TableCell>
              <TableCell align="right">Participation Score</TableCell>
              <TableCell align="right">Weighted Score</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedScores.map((score, index) => (
              <TableRow key={score.responseId || index}>
                <TableCell>{score.schoolName}</TableCell>
                <TableCell>{score.teacherName}</TableCell>
                <TableCell align="right">{score.toneScore.toFixed(1)}</TableCell>
                <TableCell align="right">{score.effortScore.toFixed(1)}</TableCell>
                <TableCell align="right">{score.participationScore.toFixed(1)}</TableCell>
                <TableCell align="right">{score.weightedScore.toFixed(2)}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={score.usesLtPMethods ? "Uses LtP" : "Below Threshold"} 
                    color={score.usesLtPMethods ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderTeacherSkillsTable = () => {
    if (!indicatorData.detailedScores || indicatorData.detailedScores.length === 0) {
      return (
        <Typography variant="body1">
          No detailed teacher skills data available.
        </Typography>
      );
    }

    // Sort by average score in descending order
    const sortedScores = [...indicatorData.detailedScores]
      .sort((a, b) => b.avgScore - a.avgScore);

    return (
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>School</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell align="right">Average Score</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedScores.map((score, index) => (
              <TableRow key={score.responseId || index}>
                <TableCell>{score.schoolName}</TableCell>
                <TableCell>{score.teacherName}</TableCell>
                <TableCell align="right">{score.avgScore.toFixed(2)}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={score.hasLtPSkills ? "Has LtP Skills" : "Below Threshold"} 
                    color={score.hasLtPSkills ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderEnrollmentTable = () => {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Enrollment Type</TableCell>
              <TableCell align="right">Count</TableCell>
              <TableCell align="right">Percentage</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Boys Enrolled</TableCell>
              <TableCell align="right">{indicatorData.boysEnrollment.toLocaleString()}</TableCell>
              <TableCell align="right">
                {(indicatorData.totalEnrollment > 0 
                  ? (indicatorData.boysEnrollment / indicatorData.totalEnrollment) * 100 
                  : 0).toFixed(2)}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Girls Enrolled</TableCell>
              <TableCell align="right">{indicatorData.girlsEnrollment.toLocaleString()}</TableCell>
              <TableCell align="right">
                {(indicatorData.totalEnrollment > 0 
                  ? (indicatorData.girlsEnrollment / indicatorData.totalEnrollment) * 100 
                  : 0).toFixed(2)}%
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell><strong>Total Enrollment</strong></TableCell>
              <TableCell align="right"><strong>{indicatorData.totalEnrollment.toLocaleString()}</strong></TableCell>
              <TableCell align="right"><strong>100%</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderSchoolsReachedTable = () => {
    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Metric</TableCell>
              <TableCell align="right">Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Total Unique Schools</TableCell>
              <TableCell align="right">{indicatorData.schoolsReached}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Paper sx={{ p: 3, mt: 2, width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          {getIndicatorTitle()}
        </Typography>
        <Tooltip title="How this indicator is calculated">
          <IconButton size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Calculation Summary</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            <Typography variant="subtitle2" gutterBottom>Formula:</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {getFormulaDescription()}
            </Typography>

            <Typography variant="subtitle2" gutterBottom>Result:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" color="primary">
                {(() => {
                  switch (indicatorType) {
                    case 'implementationPlans':
                    case 'developmentPlans':
                    case 'lessonPlans':
                    case 'learningEnvironments':
                    case 'teacherSkills':
                      return `${indicatorData.percentage?.toFixed(1) || 0}%`;
                    case 'enrollment':
                      return indicatorData.totalEnrollment?.toLocaleString() || 0;
                    case 'schoolsReached':
                      return indicatorData.schoolsReached || 0;
                    default:
                      return 'N/A';
                  }
                })()}
              </Typography>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Tabs for different views */}
      <Box sx={{ mt: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<BarChartIcon />} label="DISTRICT COMPARISON" />
          <Tab icon={<SchoolIcon />} label="HISTORICAL TREND" />
          <Tab icon={<PersonIcon />} label="RAW DATA" />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {/* District Comparison Tab */}
          {activeTab === 0 && (
            <Box sx={{ height: 400, width: '100%' }}>
              {districtBreakdown && districtBreakdown.length > 0 ? (
                <Charts 
                  options={getDistrictChartData().options}
                  series={getDistrictChartData().series}
                  type="bar"
                  height={400}
                />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%', 
                  flexDirection: 'column' 
                }}>
                  <HelpIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No district comparison data available
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Historical Trend Tab */}
          {activeTab === 1 && (
            <Box sx={{ height: 400, width: '100%' }}>
              {historicalData && historicalData.length > 0 ? (
                <Charts 
                  options={getHistoricalChartData().options}
                  series={getHistoricalChartData().series}
                  type="line"
                  height={400}
                />
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%', 
                  flexDirection: 'column' 
                }}>
                  <HelpIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No historical data available
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Raw Data Tab */}
          {activeTab === 2 && (
            <Box sx={{ mt: 1 }}>
              {renderRawDataTable()}
            </Box>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Typography variant="caption" color="text.secondary">
          Last calculated: {formatDate(new Date())}
        </Typography>
      </Box>
    </Paper>
  );
}