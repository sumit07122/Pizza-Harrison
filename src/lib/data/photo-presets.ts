export interface FoodPhotoPreset {
  title: string;
  category: string;
  url: string;
  tags?: string[];
}

export const FOOD_PHOTO_PRESETS: FoodPhotoPreset[] = [
  {
    title: 'Margherita Classic',
    category: 'Pizza',
    url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
    tags: ['veg', 'cheese', 'pizza'],
  },
  {
    title: 'Peppy Paneer Supreme',
    category: 'Pizza',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    tags: ['veg', 'paneer', 'pizza', 'bestseller'],
  },
  {
    title: 'Farmhouse Fresh Veggie',
    category: 'Pizza',
    url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
    tags: ['veg', 'capsicum', 'mushroom', 'pizza'],
  },
  {
    title: 'Double Cheese Burst',
    category: 'Pizza',
    url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80',
    tags: ['cheese', 'burst', 'pizza'],
  },
  {
    title: 'Tandoori Paneer Tikka',
    category: 'Pizza',
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    tags: ['spicy', 'tandoori', 'paneer', 'pizza'],
  },
  {
    title: 'Harrison Chef Deluxe Special',
    category: 'Pizza',
    url: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=800&q=80',
    tags: ['deluxe', 'special', 'pizza'],
  },
  {
    title: 'Fiery Jalapeno & Red Pepper',
    category: 'Pizza',
    url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=800&q=80',
    tags: ['spicy', 'pepper', 'pizza'],
  },
  {
    title: 'Stuffed Garlic Breadsticks',
    category: 'Sides',
    url: 'https://images.unsplash.com/photo-1619895092538-128341789043?auto=format&fit=crop&w=800&q=80',
    tags: ['garlic bread', 'sides'],
  },
  {
    title: 'Cheesy Jalapeno Dip',
    category: 'Sides',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    tags: ['dip', 'cheese', 'sides'],
  },
  {
    title: 'Creamy White Sauce Pasta',
    category: 'Pasta',
    url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80',
    tags: ['pasta', 'creamy', 'italian'],
  },
  {
    title: 'Crispy Salt & Pepper Fries',
    category: 'Sides',
    url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    tags: ['fries', 'potato', 'sides'],
  },
  {
    title: 'Molten Choco Lava Cake',
    category: 'Dessert',
    url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
    tags: ['dessert', 'choco', 'cake'],
  },
  {
    title: 'Warm Chocolate Fudge Brownie',
    category: 'Dessert',
    url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80',
    tags: ['dessert', 'brownie', 'fudge'],
  },
  {
    title: 'Virgin Mint Lime Mojito',
    category: 'Drinks',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    tags: ['beverage', 'mojito', 'mocktail'],
  },
  {
    title: 'Chilled Masala Jeera Lemonade',
    category: 'Drinks',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    tags: ['beverage', 'lemonade', 'desi'],
  },
  {
    title: 'Harrison Mega Combo Feast',
    category: 'Combos',
    url: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&w=800&q=80',
    tags: ['combo', 'family', 'feast'],
  },
];
