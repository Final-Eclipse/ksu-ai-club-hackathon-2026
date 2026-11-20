import type { CampusId, DiningHall } from '../types';

export const NUTRISLICE_MENU_URL = 'https://ksu.nutrislice.com/menu';

export const DINING_HALLS: readonly DiningHall[] = [
  {
    id: 'k-commons',
    campusId: 'kennesaw',
    placeId: 'k-commons',
    name: 'The Commons',
    short: 'The Commons (Kennesaw)',
    geo: { lat: 34.039901, lng: -84.5818194 },
    stations: [
      {
        id: 'k-apron-strings',
        name: 'Apron Strings',
        tags: ['vegetarian', 'gluten-free'],
        baseQueue: 5,
        perMin: 10,
        menuItems: [
          { name: 'Southern Fried Chicken', station: 'Apron Strings', calories: 610, tags: [] },
          { name: 'Stone-Ground Grits', station: 'Apron Strings', calories: 240, tags: ['vegetarian', 'gluten-free'] },
          { name: 'Mac & Cheese', station: 'Apron Strings', calories: 420, tags: ['vegetarian'] },
          { name: 'Collard Greens', station: 'Apron Strings', calories: 120, tags: [] },
          { name: 'Cornbread', station: 'Apron Strings', calories: 210, tags: ['vegetarian'] },
        ],
      },
      {
        id: 'k-piatti',
        name: 'Piatti',
        tags: ['vegetarian', 'vegan'],
        baseQueue: 4,
        perMin: 8,
        menuItems: [
          { name: 'Brick-Oven Margherita Pizza', station: 'Piatti', calories: 590, tags: ['vegetarian'] },
          { name: 'Cavatappi Pasta Marinara', station: 'Piatti', calories: 510, tags: ['vegetarian', 'vegan'] },
          { name: 'Garlic Knots', station: 'Piatti', calories: 260, tags: ['vegetarian', 'vegan'] },
        ],
      },
      {
        id: 'k-hwy-41',
        name: 'Hwy 41',
        tags: ['vegetarian', 'vegan'],
        baseQueue: 6,
        perMin: 11,
        menuItems: [
          { name: 'Brasstown Beef Burger', station: 'Hwy 41', calories: 720, tags: [] },
          { name: 'Grilled Chicken Sandwich', station: 'Hwy 41', calories: 570, tags: [] },
          { name: 'Seasoned Fries', station: 'Hwy 41', calories: 390, tags: ['vegetarian', 'vegan'] },
        ],
      },
      {
        id: 'k-miso-caliente',
        name: 'Miso Caliente',
        tags: ['vegetarian', 'vegan', 'gluten-free'],
        baseQueue: 5,
        perMin: 9,
        menuItems: [
          { name: 'Wok Vegetable Fried Rice', station: 'Miso Caliente', calories: 460, tags: ['vegetarian', 'vegan'] },
          { name: 'Chicken Lo Mein', station: 'Miso Caliente', calories: 620, tags: [] },
          { name: 'Burrito Bowl', station: 'Miso Caliente', calories: 580, tags: ['vegetarian', 'vegan', 'gluten-free'] },
        ],
      },
      {
        id: 'k-globe-trotter',
        name: 'Globe Trotter',
        tags: ['vegetarian', 'vegan', 'halal'],
        baseQueue: 5,
        perMin: 9,
        menuItems: [
          { name: 'Halal Chicken Shawarma Plate', station: 'Globe Trotter', calories: 650, tags: ['halal'] },
          { name: 'Mediterranean Grain Bowl', station: 'Globe Trotter', calories: 520, tags: ['vegetarian', 'vegan'] },
        ],
      },
      {
        id: 'k-perch-green',
        name: 'The Perch & Campus Green',
        tags: ['vegetarian', 'vegan', 'gluten-free'],
        baseQueue: 2,
        perMin: 5,
        menuItems: [
          { name: 'Deli Turkey Wrap', station: 'The Perch & Campus Green', calories: 480, tags: [] },
          { name: 'Hummus & Veggie Box', station: 'The Perch & Campus Green', calories: 360, tags: ['vegetarian', 'vegan'] },
          { name: 'Garden Power Salad', station: 'The Perch & Campus Green', calories: 330, tags: ['vegetarian', 'vegan', 'gluten-free'] },
        ],
      },
    ],
  },
  {
    id: 'm-stingers',
    campusId: 'marietta',
    placeId: 'm-stingers',
    name: 'Stingers',
    short: 'Stingers (Marietta)',
    geo: { lat: 33.9373825, lng: -84.5222994 },
    stations: [
      {
        id: 'm-down-home',
        name: 'Down Home',
        tags: ['vegetarian', 'vegan', 'gluten-free'],
        baseQueue: 5,
        perMin: 9,
        menuItems: [
          { name: 'Southern Roasted Chicken', station: 'Down Home', calories: 540, tags: [] },
          { name: 'Mac & Cheese', station: 'Down Home', calories: 420, tags: ['vegetarian'] },
          { name: 'Green Beans', station: 'Down Home', calories: 110, tags: ['vegetarian', 'vegan', 'gluten-free'] },
          { name: 'Buttermilk Biscuit', station: 'Down Home', calories: 240, tags: ['vegetarian'] },
        ],
      },
      {
        id: 'm-revolution-pizza',
        name: 'Revolution Pizza',
        tags: ['vegetarian'],
        baseQueue: 4,
        perMin: 8,
        menuItems: [
          { name: 'Brick-Oven Pepperoni & Cheese Pizza', station: 'Revolution Pizza', calories: 680, tags: [] },
          { name: 'Italian Herb Flatbread', station: 'Revolution Pizza', calories: 490, tags: ['vegetarian'] },
        ],
      },
      {
        id: 'm-the-grill',
        name: 'The Grill',
        tags: ['vegetarian', 'vegan'],
        baseQueue: 6,
        perMin: 10,
        menuItems: [
          { name: '100% Brasstown Beef Cheeseburger', station: 'The Grill', calories: 760, tags: [] },
          { name: 'Grilled Chicken Sausage', station: 'The Grill', calories: 510, tags: [] },
          { name: 'Fries', station: 'The Grill', calories: 390, tags: ['vegetarian', 'vegan'] },
        ],
      },
      {
        id: 'm-blueprint-deli',
        name: 'Blueprint Deli',
        tags: ['vegetarian', 'vegan'],
        baseQueue: 3,
        perMin: 7,
        menuItems: [
          { name: 'Smoked Turkey & Cheddar Sub', station: 'Blueprint Deli', calories: 610, tags: [] },
          { name: 'Roasted Veggie Hummus Wrap', station: 'Blueprint Deli', calories: 470, tags: ['vegetarian', 'vegan'] },
        ],
      },
      {
        id: 'm-slice-pi',
        name: 'Slice of π (Pi)',
        tags: ['vegetarian', 'vegan', 'gluten-free'],
        baseQueue: 2,
        perMin: 4,
        menuItems: [
          { name: 'Vegan Chocolate Brownie', station: 'Slice of π (Pi)', calories: 340, tags: ['vegetarian', 'vegan'] },
          { name: 'Gluten-Free Berry Crisp', station: 'Slice of π (Pi)', calories: 310, tags: ['vegetarian', 'vegan', 'gluten-free'] },
        ],
      },
    ],
  },
];

export function getDiningHall(campusId: CampusId): DiningHall {
  const hall = DINING_HALLS.find((candidate) => candidate.campusId === campusId);
  if (!hall) throw new Error(`No dining hall configured for ${campusId}.`);
  return hall;
}
