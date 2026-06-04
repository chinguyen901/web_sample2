export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'Remote' | 'Hybrid' | 'On-site';
  salary: string;
  posted: string;
  source: 'LinkedIn' | 'Indeed' | 'Upwork';
  tags: string[];
  url: string;
}

export const MOCK_JOBS: Job[] = [
  { id: 1, title: 'Python Automation Developer', company: 'TechFlow Inc.', location: 'Remote', type: 'Remote', salary: '$40–60/hr', posted: '2m ago', source: 'Upwork', tags: ['Python', 'Selenium', 'REST API'], url: '#' },
  { id: 2, title: 'Web Scraping Engineer', company: 'DataHarvest', location: 'Remote', type: 'Remote', salary: '$35–50/hr', posted: '15m ago', source: 'LinkedIn', tags: ['Playwright', 'Python', 'PostgreSQL'], url: '#' },
  { id: 3, title: 'Telegram Bot Developer', company: 'CryptoSignals Ltd.', location: 'Remote', type: 'Remote', salary: '$500 fixed', posted: '1h ago', source: 'Upwork', tags: ['Python', 'Telegram API', 'WebSocket'], url: '#' },
  { id: 4, title: 'Browser Automation Specialist', company: 'AutomateNow', location: 'Berlin, Germany', type: 'Hybrid', salary: '$45/hr', posted: '2h ago', source: 'Indeed', tags: ['Selenium', 'JavaScript', 'Chrome Extension'], url: '#' },
  { id: 5, title: 'Data Pipeline Engineer', company: 'Analytics Co.', location: 'Remote', type: 'Remote', salary: '$60–80/hr', posted: '3h ago', source: 'LinkedIn', tags: ['Python', 'PostgreSQL', 'REST API'], url: '#' },
  { id: 6, title: 'E-commerce Scraper Developer', company: 'PriceWatch', location: 'Remote', type: 'Remote', salary: '$800 fixed', posted: '4h ago', source: 'Upwork', tags: ['Playwright', 'Python', 'BeautifulSoup'], url: '#' },
  { id: 7, title: 'RPA Developer', company: 'ProcessBot GmbH', location: 'Munich, Germany', type: 'Hybrid', salary: '$50/hr', posted: '5h ago', source: 'Indeed', tags: ['Python', 'Selenium', 'Automation'], url: '#' },
  { id: 8, title: 'Chrome Extension Developer', company: 'BrowserTools', location: 'Remote', type: 'Remote', salary: '$1,200 fixed', posted: '6h ago', source: 'Upwork', tags: ['JavaScript', 'Chrome API', 'REST API'], url: '#' },
  { id: 9, title: 'API Integration Specialist', company: 'ConnectHub', location: 'Remote', type: 'Remote', salary: '$40/hr', posted: '8h ago', source: 'LinkedIn', tags: ['Python', 'REST API', 'Webhook'], url: '#' },
  { id: 10, title: 'Freelance Automation Engineer', company: 'StartupXYZ', location: 'Remote', type: 'Remote', salary: '$300 fixed', posted: '10h ago', source: 'Upwork', tags: ['Python', 'Selenium', 'Telegram API'], url: '#' },
  { id: 11, title: 'Senior Python Developer', company: 'ScaleUp Ltd.', location: 'London, UK', type: 'Hybrid', salary: '£55/hr', posted: '12h ago', source: 'Indeed', tags: ['Python', 'PostgreSQL', 'REST API'], url: '#' },
  { id: 12, title: 'Web Data Extraction Engineer', company: 'DataMine Corp.', location: 'Remote', type: 'Remote', salary: '$45–65/hr', posted: '1d ago', source: 'LinkedIn', tags: ['Playwright', 'Selenium', 'Python'], url: '#' },
  { id: 13, title: 'Workflow Automation Consultant', company: 'OptiFlow', location: 'Remote', type: 'Remote', salary: '$2,000 fixed', posted: '1d ago', source: 'Upwork', tags: ['Python', 'REST API', 'Automation'], url: '#' },
  { id: 14, title: 'Bot Developer (Crypto Alerts)', company: 'CoinTracker', location: 'Remote', type: 'Remote', salary: '$600 fixed', posted: '2d ago', source: 'Upwork', tags: ['Python', 'Telegram API', 'WebSocket'], url: '#' },
  { id: 15, title: 'Backend Automation Engineer', company: 'Fintech Startup', location: 'Singapore', type: 'Remote', salary: '$50/hr', posted: '2d ago', source: 'LinkedIn', tags: ['Python', 'REST API', 'PostgreSQL'], url: '#' },
];
