export type BlogCategory = 'budget-finance' | 'planning-tips' | 'vendor-guides';

export interface BlogAuthor {
  name: string;
  role?: string;
  avatar?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: BlogAuthor;
  category: BlogCategory;
  tags: string[];
  featuredImage: string;
  featuredImageAlt: string;
  readingTime: number;
  featured?: boolean;
  draft?: boolean;
}

export interface BlogPostWithContent extends BlogPost {
  content: string;
}

export const CATEGORY_LABELS: Record<BlogCategory, string> = {
  'budget-finance': 'Budget & Finance',
  'planning-tips': 'Planning Tips',
  'vendor-guides': 'Vendor Guides',
};

export const CATEGORY_COLORS: Record<BlogCategory, { bg: string; text: string; border: string }> = {
  'budget-finance': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  'planning-tips': {
    bg: 'bg-primary/5',
    text: 'text-primary',
    border: 'border-primary/20',
  },
  'vendor-guides': {
    bg: 'bg-secondary/5',
    text: 'text-secondary',
    border: 'border-secondary/20',
  },
};
