const users = [
  {
    name: "QueueLess Admin",
    email: "admin@queueless.com",
    password: "Admin@123",
    role: "admin",
  },

  // Revenue Office Staff
  {
    name: "Revenue Staff 1",
    email: "revenue1@queueless.com",
    password: "Staff@123",
    role: "operator",
    officeType: "REVENUE",
    counterNumber: 1,
  },
  {
    name: "Revenue Staff 2",
    email: "revenue2@queueless.com",
    password: "Staff@123",
    role: "operator",
    officeType: "REVENUE",
    counterNumber: 2,
  },

  // Development Office Staff
  {
    name: "Development Staff 1",
    email: "development1@queueless.com",
    password: "Staff@123",
    role: "operator",
    officeType: "DEVELOPMENT",
    counterNumber: 1,
  },
  {
    name: "Development Staff 2",
    email: "development2@queueless.com",
    password: "Staff@123",
    role: "operator",
    officeType: "DEVELOPMENT",
    counterNumber: 2,
  },

  // Citizens
  {
    name: "Demo Citizen 1",
    email: "citizen1@queueless.com",
    password: "Citizen@123",
    role: "citizen",
    phone: "9000000001",
  },
  {
    name: "Demo Citizen 2",
    email: "citizen2@queueless.com",
    password: "Citizen@123",
    role: "citizen",
    phone: "9000000002",
  },
];

module.exports = users;