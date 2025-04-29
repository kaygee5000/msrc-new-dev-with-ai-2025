// Mock data for document uploads in the RTP dashboard
import { teachers } from './mockDatabase';
import { generateRandomDate } from './mockSubmissions';

// Document types that might be uploaded in surveys
const docTypes = [
  { id: 1, name: 'Implementation Plan', description: 'School implementation plan for Learning through Play' },
  { id: 2, name: 'Lesson Plan', description: 'Teacher lesson plan that includes LtP activities' },
  { id: 3, name: 'Training Certificate', description: 'Certificate of completion for LtP training' },
  { id: 4, name: 'Development Plan', description: 'School development plan including LtP components' },
  { id: 5, name: 'Assessment Report', description: 'Assessment report on LtP implementation' },
  { id: 6, name: 'Meeting Minutes', description: 'Minutes from school meetings discussing LtP' },
  { id: 7, name: 'Student Work Sample', description: 'Examples of student work from LtP activities' },
  { id: 8, name: 'Classroom Photo', description: 'Photos of classroom setup for LtP' }
];

// Generate mock document uploads
const generateMockDocumentUploads = () => {
  // Get unique schools and districts
  const uniqueSchools = [...new Set(teachers.map(t => t.school))];
  const uniqueDistricts = [...new Set(teachers.map(t => t.district))];
  
  // Generate random uploads for schools
  const schoolUploads = uniqueSchools.flatMap((school, schoolIndex) => {
    const district = teachers.find(t => t.school === school)?.district || '';
    const region = teachers.find(t => t.school === school)?.region || '';
    
    // Each school has 1-3 document uploads
    const numUploads = Math.floor(Math.random() * 3) + 1;
    
    return Array.from({ length: numUploads }, (_, i) => {
      // Select a random document type
      const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
      
      return {
        id: `school_${schoolIndex}_${i}`,
        documentType: docType.id,
        documentName: `${docType.name} - ${school}`,
        description: docType.description,
        uploadedBy: teachers.find(t => t.school === school)?.name || 'Unknown',
        school: school,
        district: district,
        region: region,
        uploadDate: generateRandomDate(),
        fileUrl: `/mock-uploads/${docType.name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}.pdf`,
        thumbnailUrl: `/mock-uploads/thumbnails/${docType.name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}.jpg`,
        fileSize: `${Math.floor(Math.random() * 5) + 1} MB`,
        fileType: 'application/pdf',
        status: 'Approved',
        relatedSurvey: Math.random() > 0.5 ? 'consolidated_checklist' : 'school_output'
      };
    });
  });
  
  // Generate random uploads for districts
  const districtUploads = uniqueDistricts.flatMap((district, districtIndex) => {
    const region = teachers.find(t => t.district === district)?.region || '';
    
    // Each district has 1-2 document uploads
    const numUploads = Math.floor(Math.random() * 2) + 1;
    
    return Array.from({ length: numUploads }, (_, i) => {
      // Select a random document type
      const docType = docTypes[Math.floor(Math.random() * docTypes.length)];
      
      return {
        id: `district_${districtIndex}_${i}`,
        documentType: docType.id,
        documentName: `${docType.name} - ${district} District`,
        description: docType.description,
        uploadedBy: 'District Education Officer',
        district: district,
        region: region,
        uploadDate: generateRandomDate(),
        fileUrl: `/mock-uploads/${docType.name.toLowerCase().replace(/\s+/g, '-')}-district-${i + 1}.pdf`,
        thumbnailUrl: `/mock-uploads/thumbnails/${docType.name.toLowerCase().replace(/\s+/g, '-')}-district-${i + 1}.jpg`,
        fileSize: `${Math.floor(Math.random() * 5) + 1} MB`,
        fileType: 'application/pdf',
        status: 'Approved',
        relatedSurvey: 'district_output'
      };
    });
  });
  
  return [...schoolUploads, ...districtUploads];
};

export const mockDocumentUploads = generateMockDocumentUploads();
export const documentTypes = docTypes;
