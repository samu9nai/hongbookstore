import api from '../lib/api';

// Create peer review with role (BUYER|SELLER)
export const createPeerReview = ({ postId, ratingLabel, ratingScore, ratingKeywords, role }) => {
  const body = { postId, ratingLabel, ratingScore, ratingKeywords };
  return api.post('/peer-reviews', body, { params: { role } });
};

// List reviews for a target user with role
export const getUserPeerReviews = (userId, role, page = 0, size = 10) =>
  api.get(`/peer-reviews/users/${userId}`, { params: { role, page, size } });

// Summary for a target user with role
export const getUserPeerSummary = (userId, role) =>
  api.get(`/peer-reviews/users/${userId}/summary`, { params: { role } });

// My received reviews with role
export const getMyReceivedPeerReviews = (role, page = 0, size = 10) =>
  api.get('/peer-reviews/my-received', { params: { role, page, size } });

