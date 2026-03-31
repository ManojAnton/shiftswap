import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Schedule from '../models/Schedule.js';
import Shift from '../models/Shift.js';
import Availability from '../models/Availability.js';

dotenv.config();

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    Schedule.deleteMany({}),
    Shift.deleteMany({}),
    Availability.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // Create manager
  const manager = new User({
    fullName: 'Admin Manager',
    email: 'manager@shiftswap.com',
    passwordHash: 'Manager@123',
    role: 'Manager',
    status: 'Active',
  });
  await manager.save();
  console.log('👤 Manager created');

  // 12 employees - mixed skills
  const employeeData = [
    { fullName: 'John Smith',     email: 'john@shiftswap.com',    skill: 'Cashier',          employmentType: 'Full-Time',  phone: '(555) 101-0001' },
    { fullName: 'Sarah Johnson',  email: 'sarah@shiftswap.com',   skill: 'Floor Staff',      employmentType: 'Part-Time',  phone: '(555) 101-0002' },
    { fullName: 'Mike Davis',     email: 'mike@shiftswap.com',    skill: 'Stock Room',       employmentType: 'Full-Time',  phone: '(555) 101-0003' },
    { fullName: 'Emily Wilson',   email: 'emily@shiftswap.com',   skill: 'Cashier',          employmentType: 'Part-Time',  phone: '(555) 101-0004' },
    { fullName: 'Lisa Brown',     email: 'lisa@shiftswap.com',    skill: 'Floor Staff',      employmentType: 'Full-Time',  phone: '(555) 101-0005' },
    { fullName: 'Tom Anderson',   email: 'tom@shiftswap.com',     skill: 'Supervisor',       employmentType: 'Full-Time',  phone: '(555) 101-0006' },
    { fullName: 'Anna Martinez',  email: 'anna@shiftswap.com',    skill: 'Cashier',          employmentType: 'Full-Time',  phone: '(555) 101-0007' },
    { fullName: 'James Lee',      email: 'james@shiftswap.com',   skill: 'Floor Staff',      employmentType: 'Part-Time',  phone: '(555) 101-0008' },
    { fullName: 'Priya Patel',    email: 'priya@shiftswap.com',   skill: 'Customer Service', employmentType: 'Full-Time',  phone: '(555) 101-0009' },
    { fullName: 'Carlos Gomez',   email: 'carlos@shiftswap.com',  skill: 'Stock Room',       employmentType: 'Part-Time',  phone: '(555) 101-0010' },
    { fullName: 'Rachel Kim',     email: 'rachel@shiftswap.com',  skill: 'Cashier',          employmentType: 'Full-Time',  phone: '(555) 101-0011' },
    { fullName: 'David Nguyen',   email: 'david@shiftswap.com',   skill: 'Supervisor',       employmentType: 'Full-Time',  phone: '(555) 101-0012' },
  ];

  const employees = [];
  for (const data of employeeData) {
    const emp = new User({ ...data, passwordHash: 'Employee@123', role: 'Employee', status: 'Active' });
    await emp.save();
    employees.push(emp);
  }
  console.log(`👥 ${employees.length} employees created`);

  // ALL employees available ALL days ALL hours - no restrictions for demo
  for (const emp of employees) {
    for (const day of DAYS) {
      await Availability.create({
        employeeId: emp._id,
        dayOfWeek: day,
        isAvailable: true,
        availableFrom: '06:00',
        availableTo: '23:00',
      });
    }
  }
  console.log('📅 Availability created - all employees available all days');

  // Get this week Monday
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + daysToMonday);
  thisMonday.setHours(0, 0, 0, 0);

  // Next week Monday
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);

  // 6 shifts per day - morning (3) + evening (3)
  // empIndex refers to employees array above
  const shiftData = [
    // MONDAY
    { dayOffset: 0, start: '09:00', end: '17:00', skill: 'Cashier',          empIndex: 0  },
    { dayOffset: 0, start: '09:00', end: '17:00', skill: 'Floor Staff',      empIndex: 1  },
    { dayOffset: 0, start: '09:00', end: '17:00', skill: 'Supervisor',       empIndex: 5  },
    { dayOffset: 0, start: '13:00', end: '21:00', skill: 'Cashier',          empIndex: 2  },
    { dayOffset: 0, start: '13:00', end: '21:00', skill: 'Floor Staff',      empIndex: 4  },
    { dayOffset: 0, start: '13:00', end: '21:00', skill: 'Customer Service', empIndex: 8  },
    // TUESDAY
    { dayOffset: 1, start: '09:00', end: '17:00', skill: 'Cashier',          empIndex: 6  },
    { dayOffset: 1, start: '09:00', end: '17:00', skill: 'Stock Room',       empIndex: 2  },
    { dayOffset: 1, start: '09:00', end: '17:00', skill: 'Supervisor',       empIndex: 11 },
    { dayOffset: 1, start: '13:00', end: '21:00', skill: 'Cashier',          empIndex: 3  },
    { dayOffset: 1, start: '13:00', end: '21:00', skill: 'Floor Staff',      empIndex: 7  },
    { dayOffset: 1, start: '13:00', end: '21:00', skill: 'Stock Room',       empIndex: 9  },
    // WEDNESDAY
    { dayOffset: 2, start: '09:00', end: '17:00', skill: 'Cashier',          empIndex: 10 },
    { dayOffset: 2, start: '09:00', end: '17:00', skill: 'Floor Staff',      empIndex: 1  },
    { dayOffset: 2, start: '09:00', end: '17:00', skill: 'Supervisor',       empIndex: 5  },
    { dayOffset: 2, start: '13:00', end: '21:00', skill: 'Cashier',          empIndex: 0  },
    { dayOffset: 2, start: '13:00', end: '21:00', skill: 'Customer Service', empIndex: 8  },
    { dayOffset: 2, start: '13:00', end: '21:00', skill: 'Floor Staff',      empIndex: 4  },
    // THURSDAY
    { dayOffset: 3, start: '09:00', end: '17:00', skill: 'Cashier',          empIndex: 6  },
    { dayOffset: 3, start: '09:00', end: '17:00', skill: 'Stock Room',       empIndex: 9  },
    { dayOffset: 3, start: '09:00', end: '17:00', skill: 'Supervisor',       empIndex: 11 },
    { dayOffset: 3, start: '13:00', end: '21:00', skill: 'Cashier',          empIndex: 3  },
    { dayOffset: 3, start: '13:00', end: '21:00', skill: 'Floor Staff',      empIndex: 7  },
    { dayOffset: 3, start: '13:00', end: '21:00', skill: 'Cashier',          empIndex: 10 },
    // FRIDAY
    { dayOffset: 4, start: '09:00', end: '17:00', skill: 'Cashier',          empIndex: 0  },
    { dayOffset: 4, start: '09:00', end: '17:00', skill: 'Floor Staff',      empIndex: 4  },
    { dayOffset: 4, start: '09:00', end: '17:00', skill: 'Supervisor',       empIndex: 5  },
    { dayOffset: 4, start: '13:00', end: '21:00', skill: 'Cashier',          empIndex: 6  },
    { dayOffset: 4, start: '13:00', end: '21:00', skill: 'Stock Room',       empIndex: 2  },
    { dayOffset: 4, start: '13:00', end: '21:00', skill: 'Customer Service', empIndex: 8  },
    // SATURDAY
    { dayOffset: 5, start: '09:00', end: '17:00', skill: 'Cashier',          empIndex: 10 },
    { dayOffset: 5, start: '09:00', end: '17:00', skill: 'Floor Staff',      empIndex: 1  },
    { dayOffset: 5, start: '09:00', end: '17:00', skill: 'Supervisor',       empIndex: 11 },
    { dayOffset: 5, start: '13:00', end: '21:00', skill: 'Cashier',          empIndex: 3  },
    { dayOffset: 5, start: '13:00', end: '21:00', skill: 'Floor Staff',      empIndex: 7  },
    { dayOffset: 5, start: '13:00', end: '21:00', skill: 'Stock Room',       empIndex: 9  },
    // SUNDAY - lighter day
    { dayOffset: 6, start: '10:00', end: '18:00', skill: 'Cashier',          empIndex: 6  },
    { dayOffset: 6, start: '10:00', end: '18:00', skill: 'Floor Staff',      empIndex: 4  },
    { dayOffset: 6, start: '10:00', end: '18:00', skill: 'Supervisor',       empIndex: 5  },
    { dayOffset: 6, start: '14:00', end: '22:00', skill: 'Cashier',          empIndex: 0  },
    { dayOffset: 6, start: '14:00', end: '22:00', skill: 'Customer Service', empIndex: 8  },
    { dayOffset: 6, start: '14:00', end: '22:00', skill: 'Stock Room',       empIndex: 2  },
  ];

  const weeks = [
    { monday: thisMonday,  label: 'This week'  },
    { monday: nextMonday,  label: 'Next week'  },
  ];

  for (const week of weeks) {
    const monday = week.monday;
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const schedule = new Schedule({
      weekStartDate: monday,
      weekEndDate: sunday,
      status: 'Published',
      createdBy: manager._id,
      publishedAt: new Date(),
    });
    await schedule.save();

    for (const s of shiftData) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + s.dayOffset);
      await Shift.create({
        scheduleId: schedule._id,
        shiftDate: date,
        startTime: s.start,
        endTime: s.end,
        requiredSkill: s.skill,
        assignedEmployeeId: employees[s.empIndex]._id,
        location: 'Main Store',
      });
    }
    console.log(`📋 ${week.label} schedule created (6 shifts/day, 7 days)`);
  }

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Manager:   manager@shiftswap.com  /  Manager@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Employees: (all use password: Employee@123)');
  console.log('  john@shiftswap.com    sarah@shiftswap.com');
  console.log('  mike@shiftswap.com    emily@shiftswap.com');
  console.log('  lisa@shiftswap.com    tom@shiftswap.com');
  console.log('  anna@shiftswap.com    james@shiftswap.com');
  console.log('  priya@shiftswap.com   carlos@shiftswap.com');
  console.log('  rachel@shiftswap.com  david@shiftswap.com');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
