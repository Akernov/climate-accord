export type Bill = {
  title: string;
  advocate: number;
  lobbyist: number;
};

export const bills: Bill[] = [
  {
    title: "Renewable Energy Subsidies",
    advocate: 3,
    lobbyist: -1,
  },
  {
    title: "Carbon Tax Expansion",
    advocate: 2,
    lobbyist: -2,
  },
  {
    title: "Oil Pipeline Approval",
    advocate: -2,
    lobbyist: 3,
  },
  {
    title: "Electric Vehicle Incentives",
    advocate: 3,
    lobbyist: -1,
  },
  {
    title: "Offshore Drilling Permits",
    advocate: -3,
    lobbyist: 3,
  },
  {
    title: "Public Transit Funding",
    advocate: 2,
    lobbyist: -1,
  },
  {
    title: "Coal Plant Shutdown",
    advocate: 3,
    lobbyist: -2,
  },
  {
    title: "Natural Gas Expansion",
    advocate: -1,
    lobbyist: 2,
  },
  {
    title: "Green Infrastructure Bill",
    advocate: 3,
    lobbyist: -1,
  },
  {
    title: "Industrial Deregulation",
    advocate: -2,
    lobbyist: 2,
  },
];