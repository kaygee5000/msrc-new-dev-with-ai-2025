# **Product Requirements Document (PRD)**  
**Lesson Observation Agent**  
**Version**: 2.0  
**Date**: [Current Date]  

---

## **1. Introduction**  
### **1.1 Purpose**  
This document outlines requirements for an agent to assess teacher performance using **play-based learning (PBL)** and **gender-responsive methodologies** during classroom observations.  

### **1.2 Scope**  
The agent evaluates:  
- Classroom environment  
- Teaching methodology  
- Student engagement  
- Lesson planning  
- Gender responsiveness  

### **1.3 Target Users**  
- **Observers**: District personnel conducting observations.  
- **Teachers**: Educators receiving feedback.  
- **Administrators**: School leaders analyzing data.  

---

## **2. Observation Categories & Questions**  

### **2.1 Basic Information**  
| ID  | Question | Answer Format | Required? |  
|-----|----------|---------------|-----------|  
| 1   | Enumerator Name | Open-ended (text) | Yes |  
| 2   | Level of Intervention | Single-select | Yes |  
|     | • GALOP  |  |  |  
|     | • Direct |  |  |  
|     | • Indirect |  |  |  
| 3   | GPS Location | Auto-record | Yes |  
| 4   | Region | Dropdown | Yes |  
| 5   | Name of District | Dropdown | Yes |  
| 6   | Name of Circuit | Dropdown | Yes |  
| 7   | Name of School | Dropdown | Yes |  
| 8   | Academic Year | Open-ended (text) | Yes |  
| 9   | Term | Single-select | Yes |  
| 69  | Date of the Lesson Observation | Open-ended (text) | Yes |  
| 70  | Full name of Teacher Observed | Open-ended (text) | Yes |  
| 71  | Grade of Class Observed | Open-ended (text) | Yes |  
| 72  | Subject taught in this lesson observation | Open-ended (text) | Yes |  
| 73  | Topic/Strand of Lesson Observed | Open-ended (text) | Yes |  
| 74  | Sub Topic/Sub Strand of Lesson Observed | Open-ended (text) | Yes |  
| 75  | Reference material of Lesson Observed | Open-ended (text) | Yes |  
| 76  | Planned Time of Lesson Observed | Open-ended (text) | Yes |  
| 77  | Activity Type | Single-select | Yes |  
| 123 | Actual Time | Open-ended (text) | Yes |  

**Purpose**: Captures metadata about the lesson and teacher.  

---

### **2.2 Classroom Demographics**  
| ID  | Question | Answer Format | Required? |  
|-----|----------|---------------|-----------|  
| 78  | Number of Girls Present | Open-ended (number) | Yes |  
| 79  | Number of Boys Present | Open-ended (number) | Yes |  
| 80  | Number of Girls with special needs/disability present | Open-ended (number) | Yes |  
| 81  | Number of Boys with special needs/disability present | Open-ended (number) | Yes |  

**Purpose**: Tracks student attendance and inclusivity.  

---

### **2.3 Classroom Environment**  
| ID  | Question | Answer Format | Required? |  
|-----|----------|---------------|-----------|  
| 97  | Are there sufficient tables and chairs for boys and girls? | Single-select | Yes |  
| 98  | Are there sufficient textbooks for boys and girls? | Single-select | Yes |  
| 99  | Are boys and girls distributed around the classroom? | Single-select | Yes |  
| 102 | What visual aids are displayed on walls? | Multi-select | Yes |  
| 117 | Teacher organizes a variety of learning spaces for play (e.g., reading corner). | Single-select | Yes |  

**Purpose**: Evaluates physical setup and resource equity.  

---

### **2.4 Lesson Planning & Structure**  
| ID  | Question | Answer Format | Required? |  
|-----|----------|---------------|-----------|  
| 85  | Is there a learner plan with clear performance indicators available when requested from teacher? | Single-select | Yes |  
| 29  | Is there a learner plan with clear performance indicator available when requested from teacher? | Single-select | Yes |  
| 30  | Are performance indicators SMART and relevant to topics? | Single-select | Yes |  
| 87  | Does the learner plan include interactive group activities? | Single-select | Yes |  
| 88  | Has the teacher stated appropriate TLR? | Single-select | Yes |  
| 89  | Are performance indicators clear to pupils at lesson start? | Single-select | Yes |  
| 100 | Are relevant core competencies stated? | Single-select | Yes |  
| 101 | Does the learner plan align with core competencies? | Single-select | Yes |  
| 113 | The teacher uses guided play in the lesson. | Single-select | Yes |  

**Purpose**: Assesses lesson organization and alignment with PBL.  

---

### **2.5 Teaching Methodology**  
| ID  | Question | Answer Format | Required? |  
|-----|----------|---------------|-----------|  
| 90  | Does the teacher use appropriate questioning skills? | Single-select | Yes |  
| 91  | Did the teacher form small groups for tasks? | Single-select | Yes |  
| 92  | Did the teacher create space for discussion? | Single-select | Yes |  
| 93  | Does the teacher evaluate the lesson? | Single-select | Yes |  
| 45  | Does the teacher allow pupils to participate in class? | Single-select | Yes |  
| 103 | Does the teacher use the chalkboard appropriately? | Single-select | Yes |  
| 104 | Does the teacher use TLRs in teaching? | Single-select | Yes |  
| 111 | Teacher encourages movement in lesson. | Single-select | Yes |  
| 114 | Teacher encourages use of manipulatives. | Single-select | Yes |  
| 119 | Teacher encourages child-guided activities with scaffolding. | Single-select | Yes |  

**Purpose**: Measures active learning strategies.  

---

### **2.6 Teacher Communication & Gender Responsiveness**  
| ID  | Question | Answer Format | Required? |  
|-----|----------|---------------|-----------|  
| 82–84 | Does the teacher speak to pupils in a friendly tone? | Single-select | Yes |  
| 44  | Does the teacher actively acknowledge student effort when they give incorrect answers? | Single-select | Yes |  
| 94  | Sex of the Teacher | Single-select | Yes |  
| 95  | Has the teacher received RTP training? | Single-select | Yes |  
| 96  | Language(s) used during lesson | Multi-select | Yes |  
| 105 | Does the teacher encourage both genders to answer questions? | Single-select | Yes |  
| 106 | Does the teacher encourage both genders to ask questions? | Single-select | Yes |  
| 107 | Does the teacher address pupils by name? | Single-select | Yes |  
| 108 | Does the teacher walk around and check in with students? | Single-select | Yes |  
| 109 | Disciplinary methods used | Multi-select | Yes |  
| 110 | Who is the victim/perpetrator of disciplinary methods? | Single-select | Yes |  

**Purpose**: Evaluates inclusive communication and discipline practices.  

---

### **2.7 Student Participation & Play-Based Learning**  
| ID  | Question | Answer Format | Required? |  
|-----|----------|---------------|-----------|  
| 112 | Teacher incorporates traditional games/songs/dances. | Single-select | Yes |  
| 115 | Teacher offers choice in activities/materials. | Single-select | Yes |  
| 116 | Teacher uses stories to deliver lessons. | Single-select | Yes |  
| 118 | Pupils play with materials (shapes/colors). | Single-select | Yes |  
| 120 | Pupils work in pairs/groups. | Single-select | Yes |  

**Purpose**: Tracks engagement in play-based activities.  

---

### **2.8 Assessment Practices**  
*(No standalone questions; embedded in Lesson Planning & Teaching Methodology sections.)*  

---

### **2.9 Overall Reflection**  
| ID  | Question | Answer Format | Required? |  
|-----|----------|---------------|-----------|  
| 121 | What went well? | Open-ended (text) | Yes |  
| 122 | What needs improvement for play-based/gender-responsive lessons? | Open-ended (text) | Yes |  

**Purpose**: Captures qualitative feedback.  

---

## **3. Technical Requirements**  
- **Data Types**:  
  - Single-select (Yes/No)  
  - Multi-select (lists)  
  - Open-ended (text/number)  
- **Reporting**:  
  - Export to CSV/Excel.  
  - Dashboard for trend analysis.  
- **Scoring**:  
  - Future enhancement: Add scoring logic (`hasScoring` is currently `false` for all).  

---

## **4. Future Enhancements**  
1. **Scoring System**: Quantify performance per category.  
2. **Multimedia Support**: Allow photo/video uploads.  
3. **Integration**: Sync with teacher training modules.  

---

## **5. Approval**  
| Role | Name | Signature | Date |  
|------|------|-----------|------|  
| Product Owner | [Name] | [Signature] | [Date] |  
| Developer | [Name] | [Signature] | [Date] |  

---

### **Appendix**  
- **Total Questions**: **55** (17 in original subset + 38 new).  
- **Breakdown**:  
  - Single-select: 40  
  - Multi-select: 3  
  - Open-ended: 12  

### **6. Comparison**  
OUTCOME INDICATORS  
Please label the indicators accordingly on the pages.  
Below are the questions to be seeded for the outcome indicators.  
Partners in Play (This questionnaire should be named as such everywhere it is to be accessed)  
1. Enumerator Name (Open ended answer)  
2. Level of intervention  
   - GALOP  
   - Direct  
   - Indirect  
3. GPS Location (Record automatically)  
4. In which region are you filling out this form? (Dropdown)  
5. Name of District (Dropdown)  
6. Name of Circuit (Dropdown)  
7. Name of school (Dropdown)  
8. Academic Year (Open ended answer)  
9. Term (Radio Buttons)  
10. Date of the Lesson Observation (Calendar Picker)  
11. Full Name of the Teacher Observed (Dropdown)  
12. Grade (Class) (Options: Load from the DB:  
    - KG1  
    - KG2  
    - Basic 1  
    - Basic 2  
    - Basic 3  
    - Basic 4  
    - Basic 5  
    - Basic 6  
13. Topic (Strand) (Options: Load with options from the DB)  
14. Sub Topic/Sub Strand (Open Ended Response)  
15. Reference Material (Open Ended Response)  
16. Planned Time (Open ended Response)  
17. Activity Type (options are:  
    - Demonstration Lesson  
    - Peer Teaching  
Display this before the following questions  
The lesson observation seeks to identify total number and percentage of teachers trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation. These criteria include:  
- Whether the lesson used play-based learning approaches  
- Whether the lesson provided opportunities for reflect, connect and apply.  
- Whether the teacher made use of positive discipline approaches.  
- Whether the lesson was gender-responsive in its treatment of boys and girls.  
18. Sex of the Teacher (Radio buttons: male and female)  
19. Has the teacher received training from RTP? (Radio buttons: Yes and No)  
20. Subject taught in this lesson observation (Dropdown: Populate from subject DB)  
21. Language teacher used during lesson observation (Multiple choice. Can select multiples answers. Options include:  
    - English  
    - Ga  
    - Dagbani  
    - Ewe  
    - Twi  
    - Dangme  
    - Other  
22. Number of Girls Present: (Open ended)  
23. Number of boys Present: (Open ended)  
24. Number of Girls with special needs/disability present (ask teacher) (Open ended)  
25. Number of Boys with special needs/disability present (ask teacher) (Open ended)  
26. Are there sufficient tables and chairs for boys and girls? (options are:  
    - Yes, equal distribution  
    - More boys have tables and chairs  
    - More girls have tables and chairs  
    - No, tables and chairs are not sufficient for both girls and boys  
27. Are there sufficient textbooks for boys and girls? (options are:  
    - Yes, equal distribution  
    - More boys have textbooks  
    - More girls have textbooks  
    - No, textbooks are not sufficient for both girls and boys  
    - No textbooks at all  
28. Are boys and girls distributed around the classroom? (options are:  
    - Yes  
    - No, boys are with boys and girls are with girls  
    - No, girls sit in front and boys at the back  
    - No, boys sit in front and girls at the back  
29. Is there a learner plan with clear performance indicator available when requested from teacher? (options are:  
    - Learner plan available with performance indicator  
    - Learner plan available but no performance indicator  
    - No learner plan available  
30. Are performance indicators SMART and relevant to topics?  
    - Performance indicators are irrelevant to topics/subtopics  
    - Performance indicators are relevant to topics/sub-topics but generally in abstract terms  
    - Performance indicators are clear and SMART, but NOT related to evaluations which are stated in lesson plan  
    - Performance indicators are clear and SMART, and related to evaluations which are stated in lesson plan  
    - Performance indicators are clear and SMART and include at least 2 profile dimensions in the syllabus. (knowledge, understanding, application, process skills and attitudes)  
31. Does the learner plan include any interactive group activities (eg games, group work, pair learning, role plays, demonstrations, songs, rhymes)  
    - Yes, two or more are included  
    - Yes, one is included  
    - No, none is included  
32. Has the teacher stated appropriate TLR?  
    - Teacher did Not state TLRs  
    - TLRs stated BUT not related to lesson objectives  
    - TLRs stated and are relevant to lesson objectives  
    - TLRs are stated and indicated in suitable development stages of lesson  
33. Are the Performance Indicators for the lesson made clear to the pupils at start of lesson? (options are:  
    - Yes, written on chalkboard  
    - Yes, explained by teacher  
    - Yes, explained by teacher and written on board  
    - Yes, other means (specify)  
    - No  
34. Are relevant core competencies stated?  
    - Core Competencies stated are Not relevant to topics/sub-topics  
    - Core Competencies are relevant to topics /sub-topics, BUT not related to main skills and/or concepts to be learnt  
    - Core Competencies stated are closely related to lesson objectives  
    - Core Competencies clarify main skills / concepts related to pupils’ readiness / daily life  
    - No core competencies were stated  
35. Does the learner plan have learner activities related to the core competencies?  
    - Activities are provided but not related to core Competencies  
    - Provides activities that are related to core Competencies of the lesson, but these are not helpful for pupils to understand new concepts  
    - Activities are relevant to core Competencies and help pupils understand new concepts.  
    - Teacher provides activities that encourage pupils to reflect their readiness, existing knowledge and concepts  
    - Teacher provides activities that encourage pupils to apply new knowledge / concepts for their daily life.  
36. What visual aids are displayed on walls? (Can select more than one. Options are:  
    - Manufactured wall charts  
    - Home-made wall charts  
    - Pupils’ work from this term  
    - Pupils’ work from previous terms  
    - None displayed  
    - Other  
37. Does teacher use the chalkboard appropriately? (options are:  
    - Teacher does not write on the chalkboard  
    - Writing is in appropriate size, color strength and clear  
    - Writing on the chalkboard is well-planned with letters, figures and illustrations which are formed neatly and correctly  
    - Writing on the chalkboard is systematically planned and logically organised.  
    - Chalkboard is systematically used to help learners during reflections/ plenary for pupils to understand lesson  
38. Does the teacher use TLRs in teaching?  
    - Teacher does not use any TLRs in lesson  
    - Teacher uses TLRs, but not relevant to lesson objectives/ content standard/Performance indicators.  
    - Teacher uses TLRs which are relevant to lesson objectives at appropriate stages in lesson.  
    - Teacher uses TLRs which are stimulating and attractive for pupils and makes pupils to use them actively.  
    - Teacher uses TLRs which are relevant to pupils’ previous lesson / topic / daily life and readiness and makes pupils to understand new concepts and pose / solve problems through TLRs  
39. Does the teacher use appropriate questioning skills?  
    - Teacher does not ask questions at all in lesson.  
    - Teacher asks only low order (recall) and rhetorical questions such as yes-or-no questions.  
    - Teacher asks well-balanced low / high order questions, pauses and calls on volunteers to respond.  
    - Teacher asks low/ high order questions which promote higher order responses and encourages even non-volunteers to respond or ask questions.  
    - Teacher asks low / high order questions, one at a time and sequenced in order of difficulty which is suited to the level of pupils  
40. Does teacher encourage both boys and girls to answer questions?  
    - Frequently  
    - Sometimes, but not regularly  
    - Only boys  
    - Only girls  
    - Not at all  
41. Does the teacher encourage both boys and girls to ask questions?  
    - Frequently  
    - Sometimes, but not regularly  
    - Only boys  
    - Only girls  
    - Not at all  
42. Does the teacher address individual pupils in class by name?  
    - Only boys  
    - Only girls  
    - Mostly boys  
    - Mostly girls  
    - Both  
    - Neither  
43. Does teacher speak to pupils in a friendly tone?  
    - Frequently  
    - Sometimes, but not regularly  
    - Only with boys  
    - Only with girls  
    - Not at all  
44. Does the teacher actively acknowledge student effort when they give incorrect answers? (For example: thank them for participating)  
    - Frequently  
    - Sometimes, but not regularly  
    - Only boys  
    - Only girls  
    - Not at all  
45. Does teacher allow pupils to participate in class?  
    - Teacher keeps talking without involving pupils  
    - Teacher introduces activities which arouse pupils’ interests but demonstrates them by teacher him / herself.  
    - Teacher introduces activities, and pupils participate in it actively and with interests.  
    - Teacher introduces activities that equip pupils with generic skills through problem solving. (Teacher initiates Inquiry-based learning)  
    - Teacher introduces activities that promote mutual learning among pupils (Pupils initiate collaborative inquiry-based learning).  
46. Did the teacher form small groups to undertake tasks?  
    - Yes, mixed group  
    - Yes, Boys only  
    - Yes, Girls only  
    - Not at all  
47. Does the teacher walk around the classroom and check in with students  
    - Frequently  
    - Sometimes, but not regularly  
    - Not at all  
48. Did the teacher create space for discussion? (Reflect-Connect-Apply)  
    - Frequently  
    - Sometimes, but not regularly  
    - Not at all  
49. Does teacher make evaluation of the lesson taught?  
    - Teacher makes no evaluation of lesson.  
    - Teacher assesses pupils’ knowledge / understanding during the lesson, but the assessment is not related to objectives/core competencies of lesson  
    - Teacher assesses pupils’ knowledge / understanding during the lesson which are related to objectives/ core competencies of lesson  
    - Teacher assesses pupils’ understanding during lesson (formative assessment) and restructures the development of lesson based on the result of evaluation of pupils’ understanding  
    - Teacher assesses pupils’ readiness / understanding / achievement in the lesson using appropriate questions based on at least 2 profile dimensions in syllabus (knowledge, understanding, application, process skills and attitudes).  
50. Select the disciplinary methods that teacher uses during the lesson observation. (User can select multiple answers. Options are:  
    - Kneeling  
    - Canning  
    - Writing lines of word  
    - Explain impact of behavior  
    - Gave Learner the opportunity to explain him/herself  
    - Gave no attention to the Learner/perpetrator  
    - Refer Learner to the agreed rules for classroom engagement  
    - Assign learner to share or pack learners’ book for the day  
    - Send Learner to Headteacher  
    - Shouting and yelling at the Learner  
    - Clean classroom  
    - None  
51. Who is the victim/perpetrator of the disciplinary method used.  
    - Boy  
    - Girl  
    - Both  
    - None  
52. Teachers encourages movement in lesson  
    - Yes  
    - No  
53. Teacher incorporates traditional games, songs and dances in lesson  
    - Yes  
    - No  
54. The teacher uses guided play in the lesson.  
    - Yes  
    - No  
55. The teacher encourages pupils to use manipulatives (e.g., counters, bundles of sticks, charts, objects etc.) in the lesson.  
    - Yes  
    - No  
56. Teacher offers children the chance to choose activities and/or materials for play.  
    - Yes  
    - No  
57. Teacher engages children in using stories to deliver lesson.  
    - Yes  
    - No  
58. Teacher organizes a variety of learning spaces for play (e.g. reading corner).  
    - Yes  
    - No  
59. Pupils have chances to play with materials or objects (different shapes and colours)  
    - Yes  
    - No  
60. Teacher encourages child-guided activities or experiences with scaffolding.  
    - Yes  
    - No  
61. Pupils work in pairs or groups  
    - Yes  
    - No  
62. What do you think went well? (Use this space to record your thoughts) (Open ended response)  
63. What do you think needs to be improved to make the lesson play-based and gender responsive? (Use this space to record your thoughts)(Open ended response)  
64. Actual Time (Open ended response)  

---

## **7. DB JSON**  
```json
{
    "questions": [
        {
            "id": 69,
            "uuid": "right_to_play_outcome_indicator_partners_in_play_question_teachers_basic_information_question_one",
            "category_id": 4,
            "question": "Date of the Lesson Observation",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation",
            "hasScoring": false
        },
        {
            "id": 70,
            "uuid": "right_to_play_outcome_indicator_partners_in_play_question_teachers_basic_information_question_two",
            "category_id": 4,
            "question": "Full name of Teacher Observed",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation",
            "hasScoring": false
        },
        {
            "id": 71,
            "uuid": "right_to_play_outcome_indicator_partners_in_play_question_teachers_basic_information_question_three",
            "category_id": 4,
            "question": "Grade of Class Observed",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation",
            "hasScoring": false
        },
        {
            "id": 72,
            "uuid": "right_to_play_outcome_indicator_partners_in_play_question_teachers_basic_information_question_four",
            "category_id": 4,
            "question": "Subject taught in this lesson observation",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation",
            "hasScoring": false
        },
        {
            "id": 73,
            "uuid": "right_to_play_outcome_indicator_partners_in_play_question_teachers_basic_information_question_five",
            "category_id": 4,
            "question": "Topic/Strand of Lesson Observed",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation",
            "hasScoring": false
        },
        {
            "id": 74,
            "uuid": "right_to_play_outcome_indicator_partners_in_play_question_teachers_basic_information_question_six",
            "category_id": 4,
            "question": "Sub Topic/Sub Strand of Lesson Observed",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation",
            "hasScoring": false
        },
        {
            "id": 75,
            "uuid": "right_to_play_outcome_indicator_partners_in_play_question_teachers_basic_information_question_seven",
            "category_id": 4,
            "question": "Reference material of Lesson Observed",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation",
            "hasScoring": false
        },
        {
            "id": 76,
            "uuid": "right_to_play_outcome_indicator_partners_in_play_question_teachers_basic_information_question_eight",
            "category_id": 4,
            "question": "Planned Time of Lesson Observed",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation",
            "hasScoring": false
        },
        {
            "id": 77,
            "uuid": "right_to_play_outcome_indicator_partners_in_play_question_teachers_basic_information_question_nine",
            "category_id": 4,
            "question": "Activity Type",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation",
            "hasScoring": false
        },
        {
            "id": 78,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_enrolment_girls",
            "category_id": 5,
            "question": "Number of Girls Present",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_number",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 79,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_enrolment_boys",
            "category_id": 5,
            "question": "Number of boys Present",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_number",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 80,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_enrolment_special_need_girls",
            "category_id": 5,
            "question": "Number of Girls with special needs/disability present",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_number",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 81,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_enrolment_special_need_boys",
            "category_id": 5,
            "question": "Number of Boys with special needs/disability present (ask teacher)",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_number",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 82,
            "uuid": "right_to_play_question_outcome_indicator_consolidated_checklist_question_learning_environment_question_one",
            "category_id": 5,
            "question": "Does teacher speak to pupils in a friendly tone?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 83,
            "uuid": "right_to_play_question_outcome_indicator_consolidated_checklist_question_learning_environment_question_two",
            "category_id": 5,
            "question": "Does teacher speak to pupils in a friendly tone?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 84,
            "uuid": "right_to_play_question_outcome_indicator_consolidated_checklist_question_learning_environment_question_three",
            "category_id": 5,
            "question": "Does teacher speak to pupils in a friendly tone?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 85,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_learn_observation_one",
            "category_id": 5,
            "question": "Is there a learner plan with clear performance indicator available when requested from teacher?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 86,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_learn_observation_two",
            "category_id": 5,
            "question": "Is there a learner plan with clear performance indicator available when requested from teacher?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 87,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_learn_observation_three",
            "category_id": 5,
            "question": "Does the learner plan include any interactive group activities (eg games, group work, pair learning, role plays, demonstrations, songs, rhymes)",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 88,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_learn_observation_four",
            "category_id": 5,
            "question": "Has the teacher stated appropriate TLR?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 89,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_learn_observation_five",
            "category_id": 5,
            "question": "Are the Performance Indicators for the lesson made clear to the pupils at start of lesson?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 90,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_learn_observation_six",
            "category_id": 5,
            "question": "Does the teacher use appropriate questioning skills?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 91,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_learn_observation_seven",
            "category_id": 5,
            "question": "Did the teacher form small groups to undertake tasks?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 92,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_learn_observation_eight",
            "category_id": 5,
            "question": "Did the teacher create space for discussion? (Reflect-Connect-Apply)",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 93,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_learn_observation_nine",
            "category_id": 5,
            "question": "Does teacher make evaluation of the lesson taught?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 94,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_61a52bb2-c0a5-4d83-a3fa-fbb64ef375da",
            "category_id": 5,
            "question": "Sex of the Teacher",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 95,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_8f6cb7c3-c552-4ccd-bb72-b713933eac5d",
            "category_id": 5,
            "question": "Has the teacher received training from RTP?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 96,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_29bf5b7e-c3a4-4bf5-b231-50b384e7ec9f",
            "category_id": 5,
            "question": "Language teacher used during lesson observation",
            "question_form": "close_ended",
            "close_ended_answer_form": "multiple_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 97,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_ebbb6146-6c58-4d0d-ab1a-e7106bb92a26",
            "category_id": 5,
            "question": "Are there sufficient tables and chairs for boys and girls?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 98,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_fb4e287e-1d94-4d44-b647-d1c4e8c6f8c9",
            "category_id": 5,
            "question": "Are there sufficient textbooks for boys and girls?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 99,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_af745ac6-eee3-4e70-a323-96bfb10177de",
            "category_id": 5,
            "question": "Are boys and girls distributed around the classroom?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 100,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_937f7da4-8076-4876-be18-5aa3eb6df496",
            "category_id": 5,
            "question": "Are relevant core competencies stated?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 101,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_189377f8-2f27-45c5-907a-6f74ae862e62",
            "category_id": 5,
            "question": "Does the learner plan have learner activities related to the core competencies?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 102,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_9785ed8c-3174-4b54-808a-064c743cbaf8",
            "category_id": 5,
            "question": "What visual aids are displayed on walls?",
            "question_form": "close_ended",
            "close_ended_answer_form": "multiple_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 103,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_241672c1-010c-4630-844d-707c002f9dab",
            "category_id": 5,
            "question": "Does teacher use the chalkboard appropriately?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 104,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_316fcf12-d792-4fee-b7b3-6a1bd5201b38",
            "category_id": 5,
            "question": "Does the teacher use TLRs in teaching?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 105,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_f522c311-1020-4602-aa73-e43d25c2e808",
            "category_id": 5,
            "question": "Does teacher encourage both boys and girls to answer questions?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 106,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_ccd38c2c-46cf-4448-b4c1-28c1be0cf86f",
            "category_id": 5,
            "question": "Does the teacher encourage both boys and girls to ask questions?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 107,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_12f08230-7ef6-44d2-b05d-2a822c0379ee",
            "category_id": 5,
            "question": "Does the teacher address individual pupils in class by name?",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 108,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_72b76a71-0202-4591-ad88-5263d32adb09",
            "category_id": 5,
            "question": "Does the teacher walk around the classroom and check in with students",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 109,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_f9f0dbe8-eb4b-47b4-925f-628ca9aaa725",
            "category_id": 5,
            "question": "Select the disciplinary methods that teacher uses during the lesson observation",
            "question_form": "close_ended",
            "close_ended_answer_form": "multiple_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 110,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_e7114e46-1b00-44e2-91f9-dcf6862b77d9",
            "category_id": 5,
            "question": "Who is the victim/perpetrator of the disciplinary method used.",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 111,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_6cbae3bd-5a11-4044-ac92-d0eb829b8bb7",
            "category_id": 5,
            "question": "Teachers encourages movement in lesson",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 112,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_c6e1191d-47bd-44e1-8687-ca10a7ac79d4",
            "category_id": 5,
            "question": "Teacher incorporates traditional games, songs and dances in lesson",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 113,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_cbee9318-d9a9-4347-ae0c-9256dbc7fb38",
            "category_id": 5,
            "question": "The teacher uses guided play in the lesson.",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 114,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_2bc965db-3df8-4940-aeb2-908db41b43f6",
            "category_id": 5,
            "question": "The teacher encourages pupils to use manipulatives (e.g., counters, bundles of sticks, charts, objects etc.) in the lesson.",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 115,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_dcc2cc61-9774-4c3a-894c-b7b4c7d5f10d",
            "category_id": 5,
            "question": "Teacher offers children the chance to choose activities and/or materials for play.",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 116,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_988c7e7c-a5c6-4c56-a022-629ed0f0d0b1",
            "category_id": 5,
            "question": "Teacher engages children in using stories to deliver lesson.",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 117,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_2f55a581-bf77-4eab-8036-109e30f39ed8",
            "category_id": 5,
            "question": "Teacher organizes a variety of learning spaces for play (e.g. reading corner).",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 118,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_941bfbce-0c0b-4ca3-80ef-eafcda2fd893",
            "category_id": 5,
            "question": "Pupils have chances to play with materials or objects (different shapes and colours)",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 119,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_e45653cb-1515-4fc5-a502-21e40af198bc",
            "category_id": 5,
            "question": "Teacher encourages child-guided activities or experiences with scaffolding.",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 120,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_aee03b6a-b38f-4cfd-9ef1-12ee28c972f0",
            "category_id": 5,
            "question": "Pupils work in pairs or groups",
            "question_form": "close_ended",
            "close_ended_answer_form": "single_select",
            "open_ended_answer_form": null,
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 121,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_05241a39-0d86-4a00-a486-a6e1a74b1c12",
            "category_id": 5,
            "question": "What do you think went well?",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 122,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_b2c3eb76-18e7-490d-96a0-35e636798ac3",
            "category_id": 5,
            "question": "What do you think needs to be improved to make the lesson play-based and gender responsive?",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        },
        {
            "id": 123,
            "uuid": "right_to_play_question_outcome_indicator_partners_in_play_question_actual_time",
            "category_id": 5,
            "question": "Actual Time",
            "question_form": "open_ended",
            "close_ended_answer_form": null,
            "open_ended_answer_form": "open_ended_text",
            "target": "district_person_respondent",
            "indicator_type": "outcome_indicators",
            "is_required": 1,
            "is_valid": 1,
            "deleted_at": null,
            "created_at": "2024-05-03T07:13:11.000Z",
            "updated_at": "2024-05-03T07:13:11.000Z",
            "display_order": 0,
            "has_file_upload": 0,
            "score_value": null,
            "scoring_logic": null,
            "scoring_formula": null,
            "score_min": null,
            "score_max": null,
            "category_name": "Out Indicators: Partners in Play Lesson Observation. The lesson observation seeks to identify total number and percentage of teachers\n            trained in PBL who demonstrate four key indicators of gender responsive play-based learning methodology during their lesson as observed through the classroom observation",
            "hasScoring": false
        }
    ]
}
```

---

## **8. Seed Missing Questions (Basic Information)**  
```json  
  {
    "id": 2,
    "uuid": "b3c2d88a-5c6d-4e7f-8a90-2b3c4d5e6f7a",
    "question": "Level of Intervention",
    "question_form": "close_ended",
    "close_ended_answer_form": "single_select",
    "open_ended_answer_form": null
  },
  {
    "id": 3,
    "uuid": "c4d3e77f-6b5a-4d8c-9b10-3c4d5e6f7a8b",
    "question": "GPS Location",
    "question_form": "auto_record",
    "close_ended_answer_form": null,
    "open_ended_answer_form": null
  },
  {
    "id": 4,
    "uuid": "d5e4f661-7a4b-4e9d-0c21-4d5e6f7a8b9c",
    "question": "Region",
    "question_form": "close_ended",
    "close_ended_answer_form": "single_select",
    "open_ended_answer_form": null
  },
  {
    "id": 5,
    "uuid": "e6f5a550-8b3c-4abd-1d32-5e6f7a8b9c0d",
    "question": "Name of District",
    "question_form": "close_ended",
    "close_ended_answer_form": "single_select",
    "open_ended_answer_form": null
  },
  {
    "id": 6,
    "uuid": "f7a6b441-9c2d-4bce-2e43-6f7a8b9c0d1e",
    "question": "Name of Circuit",
    "question_form": "close_ended",
    "close_ended_answer_form": "single_select",
    "open_ended_answer_form": null
  },
  {
    "id": 7,
    "uuid": "08b7c332-ad1e-4cdf-3f54-7a8b9c0d1e2f",
    "question": "Name of School",
    "question_form": "close_ended",
    "close_ended_answer_form": "single_select",
    "open_ended_answer_form": null
  },
  {
    "id": 8,
    "uuid": "19c8d223-be0f-4dea-4a65-8b9c0d1e2f3a",
    "question": "Academic Year",
    "question_form": "open_ended",
    "close_ended_answer_form": null,
    "open_ended_answer_form": "open_ended_text"
  },
  {
    "id": 9,
    "uuid": "2ad9e114-cf1a-4efb-5b76-9c0d1e2f3a4b",
    "question": "Term",
    "question_form": "close_ended",
    "close_ended_answer_form": "single_select",
    "open_ended_answer_form": null
  }
]
```