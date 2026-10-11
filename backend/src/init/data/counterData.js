const createCounters = (revenueOfficeId, developmentOfficeId) => [
  {
    officeId: revenueOfficeId,
    name: "Revenue Counter 1",
    number: 1,
    status: "AVAILABLE",
    currentTokenId: null,
  },
  {
    officeId: revenueOfficeId,
    name: "Revenue Counter 2",
    number: 2,
    status: "AVAILABLE",
    currentTokenId: null,
  },
  {
    officeId: revenueOfficeId,
    name: "Revenue Counter 3",
    number: 3,
    status: "AVAILABLE",
    currentTokenId: null,
  },
  {
    officeId: developmentOfficeId,
    name: "Development Counter 1",
    number: 1,
    status: "AVAILABLE",
    currentTokenId: null,
  },
  {
    officeId: developmentOfficeId,
    name: "Development Counter 2",
    number: 2,
    status: "AVAILABLE",
    currentTokenId: null,
  },
  {
    officeId: developmentOfficeId,
    name: "Development Counter 3",
    number: 3,
    status: "AVAILABLE",
    currentTokenId: null,
  },
];

module.exports = createCounters;