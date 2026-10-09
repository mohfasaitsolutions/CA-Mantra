import apiClient from './client';

// Blog types
export interface Blog {
  _id: string;
  title: string;
  content: string;
  excerpt?: string;
  author: {
    _id: string;
    fullName?: string;
    profilePictureUrl?: string;
    bio?: string;
  };
  slug: string;
  tags: string[];
  category: 'FOUNDATION' | 'INTERMEDIATE' | 'FINAL' | 'GENERAL' | 'TIPS' | 'NEWS';
  status: 'PUBLISHED';
  publishedAt?: string;
  viewCount?: number;
  likes: string[];
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BlogsResponse {
  success: boolean;
  data: {
    blogs: Blog[];
    pagination: {
      page: number;
      pages: number;
      total: number;
      limit: number;
    };
  };
}

export interface BlogResponse {
  success: boolean;
  data: Blog;
}

export interface CreateBlogData {
  title: string;
  content: string;
  excerpt?: string;
  tags?: string;
  category?: string;
}

export interface BlogFilters {
  page?: number;
  limit?: number;
  category?: string;
  author?: string;
  tag?: string;
  search?: string;
  status?: string;
}

// Public blog API functions
export const getBlogs = async (filters: BlogFilters = {}): Promise<BlogsResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });
  
  const response = await apiClient.get(`/blogs?${params.toString()}`);
  return response.data;
};

export const getBlog = async (slugOrId: string): Promise<BlogResponse> => {
  const response = await apiClient.get(`/blogs/public/${slugOrId}`);
  return response.data;
};

export const toggleBlogLike = async (blogId: string) => {
  const response = await apiClient.post(`/blogs/${blogId}/like`);
  return response.data;
};

// Admin/Evaluator blog API functions
export const getAdminBlogs = async (filters: BlogFilters = {}): Promise<BlogsResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });
  
  const response = await apiClient.get(`/blogs/admin?${params.toString()}`);
  return response.data;
};

export const getAdminBlog = async (id: string): Promise<BlogResponse> => {
  const response = await apiClient.get(`/blogs/${id}`);
  return response.data;
};

export const createBlog = async (data: CreateBlogData): Promise<BlogResponse> => {
  const response = await apiClient.post('/blogs', data);
  return response.data;
};

export const updateBlog = async (id: string, data: Partial<CreateBlogData>): Promise<BlogResponse> => {
  const response = await apiClient.put(`/blogs/${id}`, data);
  return response.data;
};

export const deleteBlog = async (id: string) => {
  const response = await apiClient.delete(`/blogs/${id}`);
  return response.data;
};
