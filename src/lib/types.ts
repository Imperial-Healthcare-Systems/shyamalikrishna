export interface Category {
  id: string;
  name: string;
  name_hi: string | null;
  slug: string;
  description: string | null;
  description_hi: string | null;
  short_description: string | null;
  short_description_hi: string | null;
  icon: string | null;
  display_order: number;
  seo_title: string | null;
  seo_description: string | null;
  image_url: string | null;
}

export interface Partner {
  id: string;
  name: string;
  name_hi: string | null;
  slug: string;
  tagline: string | null;
  tagline_hi: string | null;
  positioning: string | null;
  positioning_hi: string | null;
  overview: string | null;
  overview_hi: string | null;
  partnership_context: string | null;
  partnership_context_hi: string | null;
  why_partnership_matters: string | null;
  why_partnership_matters_hi: string | null;
  origin_country: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  seo_title: string | null;
  seo_description: string |  null;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  name_hi: string | null;
  slug: string;
  category_id: string | null;
  partner_id: string | null;
  positioning: string | null;
  positioning_hi: string | null;
  overview: string | null;
  overview_hi: string | null;
  features: string | null;
  features_hi: string | null;
  benefits: string | null;
  benefits_hi: string | null;
  applications: string | null;
  applications_hi: string | null;
  crops: string | null;
  soil_conditions: string | null;
  operator_scale: string | null;
  tractor_hp: string | null;
  working_width: string | null;
  weight: string | null;
  blade_tine_config: string | null;
  gearbox_drive: string | null;
  rpm: string | null;
  warranty: string | null;
  financing: string | null;
  financing_hi: string | null;
  subsidy: string | null;
  subsidy_hi: string | null;
  primary_image_url: string | null;
  gallery_images: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  display_order: number;
  category?: Category | null;
  partner?: Partner | null;
}

export interface Service {
  id: string;
  name: string;
  name_hi: string | null;
  slug: string;
  short_description: string | null;
  short_description_hi: string | null;
  overview: string | null;
  overview_hi: string | null;
  what_we_cover: string | null;
  what_we_cover_hi: string | null;
  icon: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  display_order: number;
}

export interface Resource {
  id: string;
  title: string;
  title_hi: string | null;
  slug: string;
  type: string;
  excerpt: string | null;
  excerpt_hi: string | null;
  content: string | null;
  content_hi: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  display_order: number;
}

export interface Faq {
  id: string;
  question: string;
  question_hi: string | null;
  answer: string;
  answer_hi: string | null;
  category: string | null;
  display_order: number;
}

export interface Job {
  id: string;
  title: string;
  title_hi: string | null;
  slug: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  experience: string | null;
  summary: string | null;
  summary_hi: string | null;
  responsibilities: string | null;
  responsibilities_hi: string | null;
  requirements: string | null;
  requirements_hi: string | null;
  preferred_qualifications: string | null;
  preferred_qualifications_hi: string | null;
  what_we_offer: string | null;
  what_we_offer_hi: string | null;
  application_deadline: string | null;
  status: string;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  lead_type: string;
  name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  district_village: string | null;
  enquiry_type: string | null;
  message: string | null;
  product_id: string | null;
  product_name: string | null;
  partner_name: string | null;
  category_name: string | null;
  tractor_hp: string | null;
  service_type: string | null;
  preferred_callback_time: string | null;
  source_page: string;
  language: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  note: string;
  author: string | null;
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string | null;
  job_slug: string | null;
  full_name: string;
  email: string;
  phone: string;
  current_location: string | null;
  highest_qualification: string | null;
  years_of_experience: string | null;
  resume_url: string | null;
  resume_filename: string | null;
  cover_letter: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  status: string;
  internal_notes: string | null;
  is_general: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminActivity {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string | null;
  created_at: string;
}

export interface SiteSettings {
  [key: string]: string;
}

export const LEAD_TYPES = {
  product_enquiry: 'RFQ / Product Enquiry',
  callback: 'Callback Request',
  contact: 'Contact Enquiry',
  spare_parts: 'Spare Parts',
  service: 'Service Request',
  finance: 'Finance / EMI',
  subsidy: 'Subsidy',
  institutional: 'Institutional / Bulk',
  other: 'Other',
} as const;

export const LEAD_STATUSES = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  quotation_sent: 'Quotation Sent',
  follow_up: 'Follow-up',
  won: 'Won',
  lost: 'Lost',
  closed: 'Closed',
} as const;

export const LEAD_PRIORITIES = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
} as const;

export const APPLICATION_STATUSES = {
  new: 'New',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  selected: 'Selected',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
} as const;

export const JOB_STATUSES = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
} as const;

// Re-export utility functions for convenience
export { formatDate, formatDateTime, timeAgo, slugify } from '@/lib/utils';
