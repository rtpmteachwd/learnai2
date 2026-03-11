import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@learnai.ph' },
    update: {},
    create: {
      email: 'admin@learnai.ph',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create Teacher users
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher1 = await prisma.user.upsert({
    where: { email: 'teacher1@learnai.ph' },
    update: {},
    create: {
      email: 'teacher1@learnai.ph',
      password: teacherPassword,
      name: 'Maria Santos',
      role: 'TEACHER',
    },
  });
  console.log('✅ Created teacher:', teacher1.email);

  const teacher2 = await prisma.user.upsert({
    where: { email: 'teacher2@learnai.ph' },
    update: {},
    create: {
      email: 'teacher2@learnai.ph',
      password: teacherPassword,
      name: 'Juan Cruz',
      role: 'TEACHER',
    },
  });
  console.log('✅ Created teacher:', teacher2.email);

  // Create Student users with various disability types
  const studentPassword = await bcrypt.hash('student123', 10);
  
  const students = [
    {
      email: 'student1@learnai.ph',
      name: 'Ana Garcia',
      disabilityType: 'VISUAL_IMPAIRMENT',
      grade: 'Grade 5',
      section: 'A',
    },
    {
      email: 'student2@learnai.ph',
      name: 'Pedro Reyes',
      disabilityType: 'HEARING_IMPAIRMENT',
      grade: 'Grade 5',
      section: 'A',
    },
    {
      email: 'student3@learnai.ph',
      name: 'Liza Mendoza',
      disabilityType: 'SPEECH_IMPAIRMENT',
      grade: 'Grade 6',
      section: 'B',
    },
    {
      email: 'student4@learnai.ph',
      name: 'Carlos Villanueva',
      disabilityType: 'LEARNING_DISABILITY',
      grade: 'Grade 6',
      section: 'B',
    },
    {
      email: 'student5@learnai.ph',
      name: 'Sofia Tan',
      disabilityType: 'NONE',
      grade: 'Grade 5',
      section: 'A',
    },
  ];

  const createdStudents = [];
  for (const studentData of students) {
    const student = await prisma.user.upsert({
      where: { email: studentData.email },
      update: {},
      create: {
        ...studentData,
        password: studentPassword,
        role: 'STUDENT',
      },
    });
    createdStudents.push(student);
    console.log('✅ Created student:', student.email);
  }

  // Create Courses
  const courses = [
    {
      title: 'Introduction to Mathematics',
      description: 'Learn basic mathematical concepts including addition, subtraction, multiplication, and division.',
      subject: 'Mathematics',
      gradeLevel: 'Grade 5',
      difficultyLevel: 2,
      teacherId: teacher1.id,
      creatorId: teacher1.id,
      isPublished: true,
    },
    {
      title: 'English Reading Comprehension',
      description: 'Develop reading skills and improve comprehension through engaging stories and exercises.',
      subject: 'English',
      gradeLevel: 'Grade 5',
      difficultyLevel: 3,
      teacherId: teacher1.id,
      creatorId: teacher1.id,
      isPublished: true,
    },
    {
      title: 'Science: Living Things',
      description: 'Explore the world of living organisms, their characteristics, and habitats.',
      subject: 'Science',
      gradeLevel: 'Grade 6',
      difficultyLevel: 3,
      teacherId: teacher2.id,
      creatorId: teacher2.id,
      isPublished: true,
    },
    {
      title: 'Filipino: Wika at Kulturang Pilipino',
      description: 'Matutunan ang yaman ng ating wika at kultura sa pamamagitan ng mga kwento at aktibidades.',
      subject: 'Filipino',
      gradeLevel: 'Grade 6',
      difficultyLevel: 3,
      teacherId: teacher2.id,
      creatorId: teacher2.id,
      isPublished: true,
    },
  ];

  const createdCourses = [];
  for (const courseData of courses) {
    const course = await prisma.course.create({
      data: courseData,
    });
    createdCourses.push(course);
    console.log('✅ Created course:', course.title);
  }

  // Create Lessons for the first course
  const lessons = [
    {
      courseId: createdCourses[0].id,
      title: 'Numbers and Counting',
      description: 'Learn to count and recognize numbers from 1 to 100.',
      content: `# Numbers and Counting

## Introduction
Welcome to our first lesson on numbers and counting! Today, we will learn about numbers from 1 to 100.

## Learning Objectives
By the end of this lesson, you will be able to:
1. Count from 1 to 100
2. Recognize written numbers
3. Compare numbers (greater than, less than)

## Main Content

### Counting Basics
Numbers help us count things. Let's start counting:
- 1, 2, 3, 4, 5...
- 6, 7, 8, 9, 10...

### Number Patterns
Numbers follow patterns. Can you see them?
- Counting by 2s: 2, 4, 6, 8, 10...
- Counting by 5s: 5, 10, 15, 20, 25...
- Counting by 10s: 10, 20, 30, 40, 50...

## Practice Activity
Count the objects around you. How many can you find?

## Summary
Great job learning about numbers! Keep practicing counting every day.`,
      order: 1,
      difficultyLevel: 1,
      estimatedTime: 30,
      hasTranscript: true,
    },
    {
      courseId: createdCourses[0].id,
      title: 'Addition Basics',
      description: 'Learn how to add numbers together.',
      content: `# Addition Basics

## Introduction
Addition is putting things together to find the total.

## Learning Objectives
1. Understand what addition means
2. Add single-digit numbers
3. Solve simple word problems

## Main Content

### What is Addition?
Addition means combining groups. For example:
- 2 apples + 3 apples = 5 apples
- 4 + 3 = 7

### Addition Strategies
1. Count all: Count everything together
2. Count on: Start from the bigger number and count up
3. Use your fingers: Great for small numbers

## Practice Problems
1. 3 + 4 = ?
2. 5 + 2 = ?
3. 6 + 3 = ?

## Summary
Addition helps us combine and count. Keep practicing!`,
      order: 2,
      difficultyLevel: 2,
      estimatedTime: 35,
      hasTranscript: true,
    },
  ];

  for (const lessonData of lessons) {
    const lesson = await prisma.lesson.create({
      data: lessonData,
    });
    console.log('✅ Created lesson:', lesson.title);
  }

  // Create Quizzes
  const quiz = await prisma.quiz.create({
    data: {
      courseId: createdCourses[0].id,
      title: 'Numbers and Addition Quiz',
      description: 'Test your understanding of numbers and basic addition.',
      timeLimit: 15,
      passingScore: 60,
      maxAttempts: 3,
      isAdaptive: true,
    },
  });
  console.log('✅ Created quiz:', quiz.title);

  // Create Questions for the quiz
  const questions = [
    {
      quizId: quiz.id,
      questionText: 'What number comes after 9?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['8', '10', '11', '12']),
      correctAnswer: '10',
      explanation: 'After 9 comes 10. Count: 8, 9, 10!',
      points: 1,
      difficultyLevel: 1,
    },
    {
      quizId: quiz.id,
      questionText: 'What is 5 + 3?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['6', '7', '8', '9']),
      correctAnswer: '8',
      explanation: '5 + 3 = 8. You can count on your fingers: 5, 6, 7, 8!',
      points: 1,
      difficultyLevel: 2,
    },
    {
      quizId: quiz.id,
      questionText: 'True or False: 7 is greater than 5.',
      questionType: 'true_false',
      options: JSON.stringify(['True', 'False']),
      correctAnswer: 'True',
      explanation: 'Yes! 7 comes after 5 when counting, so 7 is greater than 5.',
      points: 1,
      difficultyLevel: 1,
    },
    {
      quizId: quiz.id,
      questionText: 'What is 10 + 10?',
      questionType: 'multiple_choice',
      options: JSON.stringify(['15', '20', '25', '30']),
      correctAnswer: '20',
      explanation: '10 + 10 = 20. This is like counting by 10s: 10, 20!',
      points: 1,
      difficultyLevel: 2,
    },
    {
      quizId: quiz.id,
      questionText: 'Fill in the blank: 4 + ___ = 7',
      questionType: 'identification',
      correctAnswer: '3',
      explanation: '4 + 3 = 7. If you start at 4 and count up to 7, you count 3 more: 5, 6, 7!',
      points: 2,
      difficultyLevel: 3,
    },
  ];

  for (const questionData of questions) {
    const question = await prisma.question.create({
      data: questionData,
    });
    console.log('✅ Created question:', question.questionText.substring(0, 30) + '...');
  }

  // Enroll students in courses
  for (const student of createdStudents) {
    // Enroll in first two courses
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: createdCourses[0].id,
        progress: Math.floor(Math.random() * 50) + 10,
      },
    });
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        courseId: createdCourses[1].id,
        progress: Math.floor(Math.random() * 30),
      },
    });
  }
  console.log('✅ Enrolled students in courses');

  // Create some performance records
  for (const student of createdStudents.slice(0, 3)) {
    await prisma.performanceRecord.create({
      data: {
        studentId: student.id,
        courseId: createdCourses[0].id,
        type: 'quiz',
        score: Math.floor(Math.random() * 30) + 70,
        maxScore: 100,
        percentage: Math.floor(Math.random() * 30) + 70,
      },
    });
  }
  console.log('✅ Created performance records');

  // Create system settings
  await prisma.systemSetting.create({
    data: {
      key: 'school_name',
      value: 'LearnAI Demo School',
      description: 'Name of the school',
    },
  });
  await prisma.systemSetting.create({
    data: {
      key: 'academic_year',
      value: '2024-2025',
      description: 'Current academic year',
    },
  });
  console.log('✅ Created system settings');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Demo Accounts:');
  console.log('   Admin: admin@learnai.ph / admin123');
  console.log('   Teacher: teacher1@learnai.ph / teacher123');
  console.log('   Student: student1@learnai.ph / student123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
