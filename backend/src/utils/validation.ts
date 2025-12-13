import { Question, QuestionOption, Station, StationFeatures, UserProfile, Answer, Recommendation, QuestionCategory } from '../types/index.js';

// Validation error class
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Question validation
export function validateQuestion(question: any): question is Question {
  if (!question || typeof question !== 'object') {
    throw new ValidationError('Question must be an object');
  }

  if (!question.id || typeof question.id !== 'string') {
    throw new ValidationError('Question ID must be a non-empty string', 'id');
  }

  const validCategories: QuestionCategory[] = ['housing', 'transport', 'commercial', 'culture', 'price'];
  if (!validCategories.includes(question.category)) {
    throw new ValidationError('Question category must be one of: housing, transport, commercial, culture, price', 'category');
  }

  if (!question.text || typeof question.text !== 'string') {
    throw new ValidationError('Question text must be a non-empty string', 'text');
  }

  if (!Array.isArray(question.options) || question.options.length === 0) {
    throw new ValidationError('Question must have at least one option', 'options');
  }

  question.options.forEach((option: any, index: number) => {
    validateQuestionOption(option, `options[${index}]`);
  });

  if (typeof question.weight !== 'number' || question.weight <= 0) {
    throw new ValidationError('Question weight must be a positive number', 'weight');
  }

  return true;
}

export function validateQuestionOption(option: any, fieldPrefix = ''): option is QuestionOption {
  if (!option || typeof option !== 'object') {
    throw new ValidationError('Question option must be an object', fieldPrefix);
  }

  if (!option.id || typeof option.id !== 'string') {
    throw new ValidationError('Option ID must be a non-empty string', `${fieldPrefix}.id`);
  }

  if (!option.text || typeof option.text !== 'string') {
    throw new ValidationError('Option text must be a non-empty string', `${fieldPrefix}.text`);
  }

  if (typeof option.value !== 'number') {
    throw new ValidationError('Option value must be a number', `${fieldPrefix}.value`);
  }

  if (!Array.isArray(option.tags)) {
    throw new ValidationError('Option tags must be an array', `${fieldPrefix}.tags`);
  }

  option.tags.forEach((tag: any, index: number) => {
    if (typeof tag !== 'string') {
      throw new ValidationError(`Tag at index ${index} must be a string`, `${fieldPrefix}.tags[${index}]`);
    }
  });

  return true;
}

// Station validation
export function validateStation(station: any): station is Station {
  if (!station || typeof station !== 'object') {
    throw new ValidationError('Station must be an object');
  }

  if (!station.id || typeof station.id !== 'string') {
    throw new ValidationError('Station ID must be a non-empty string', 'id');
  }

  if (!station.name || typeof station.name !== 'string') {
    throw new ValidationError('Station name must be a non-empty string', 'name');
  }

  if (!station.nameEn || typeof station.nameEn !== 'string') {
    throw new ValidationError('Station English name must be a non-empty string', 'nameEn');
  }

  validateLocation(station.location, 'location');
  validateStationFeatures(station.features, 'features');

  if (!station.description || typeof station.description !== 'string') {
    throw new ValidationError('Station description must be a non-empty string', 'description');
  }

  return true;
}

function validateLocation(location: any, fieldPrefix: string): void {
  if (!location || typeof location !== 'object') {
    throw new ValidationError('Location must be an object', fieldPrefix);
  }

  if (typeof location.latitude !== 'number' || location.latitude < -90 || location.latitude > 90) {
    throw new ValidationError('Latitude must be a number between -90 and 90', `${fieldPrefix}.latitude`);
  }

  if (typeof location.longitude !== 'number' || location.longitude < -180 || location.longitude > 180) {
    throw new ValidationError('Longitude must be a number between -180 and 180', `${fieldPrefix}.longitude`);
  }
}

function validateStationFeatures(features: any, fieldPrefix: string): features is StationFeatures {
  if (!features || typeof features !== 'object') {
    throw new ValidationError('Station features must be an object', fieldPrefix);
  }

  // Validate housing features
  validateFeatureCategory(features.housing, `${fieldPrefix}.housing`, ['rentLevel', 'familyFriendly', 'quietness']);
  
  // Validate transport features
  if (!features.transport || typeof features.transport !== 'object') {
    throw new ValidationError('Transport features must be an object', `${fieldPrefix}.transport`);
  }
  
  validateNumericFeature(features.transport.accessibility, `${fieldPrefix}.transport.accessibility`);
  validateNumericFeature(features.transport.walkability, `${fieldPrefix}.transport.walkability`);
  
  if (!Array.isArray(features.transport.connections)) {
    throw new ValidationError('Transport connections must be an array', `${fieldPrefix}.transport.connections`);
  }

  // Validate commercial features
  validateFeatureCategory(features.commercial, `${fieldPrefix}.commercial`, ['shopping', 'restaurants', 'convenience']);
  
  // Validate culture features
  validateFeatureCategory(features.culture, `${fieldPrefix}.culture`, ['entertainment', 'history', 'nightlife']);
  
  // Validate price features
  validateFeatureCategory(features.price, `${fieldPrefix}.price`, ['costOfLiving', 'diningCost']);

  return true;
}

function validateFeatureCategory(category: any, fieldPrefix: string, requiredFields: string[]): void {
  if (!category || typeof category !== 'object') {
    throw new ValidationError('Feature category must be an object', fieldPrefix);
  }

  requiredFields.forEach(field => {
    validateNumericFeature(category[field], `${fieldPrefix}.${field}`);
  });
}

function validateNumericFeature(value: any, fieldName: string): void {
  if (typeof value !== 'number' || value < 1 || value > 5) {
    throw new ValidationError('Feature value must be a number between 1 and 5', fieldName);
  }
}

// User Profile validation
export function validateUserProfile(profile: any): profile is UserProfile {
  if (!profile || typeof profile !== 'object') {
    throw new ValidationError('User profile must be an object');
  }

  validatePreferences(profile.preferences, 'preferences');

  if (!Array.isArray(profile.priorities)) {
    throw new ValidationError('Priorities must be an array', 'priorities');
  }

  if (!Array.isArray(profile.answers)) {
    throw new ValidationError('Answers must be an array', 'answers');
  }

  profile.answers.forEach((answer: any, index: number) => {
    validateAnswer(answer, `answers[${index}]`);
  });

  return true;
}

function validatePreferences(preferences: any, fieldPrefix: string): void {
  if (!preferences || typeof preferences !== 'object') {
    throw new ValidationError('Preferences must be an object', fieldPrefix);
  }

  const requiredCategories: QuestionCategory[] = ['housing', 'transport', 'commercial', 'culture', 'price'];
  
  requiredCategories.forEach(category => {
    if (typeof preferences[category] !== 'number') {
      throw new ValidationError(`Preference for ${category} must be a number`, `${fieldPrefix}.${category}`);
    }
  });
}

export function validateAnswer(answer: any, fieldPrefix = ''): answer is Answer {
  if (!answer || typeof answer !== 'object') {
    throw new ValidationError('Answer must be an object', fieldPrefix);
  }

  if (!answer.questionId || typeof answer.questionId !== 'string') {
    throw new ValidationError('Answer question ID must be a non-empty string', `${fieldPrefix}.questionId`);
  }

  if (!answer.selectedOption || typeof answer.selectedOption !== 'string') {
    throw new ValidationError('Answer selected option must be a non-empty string', `${fieldPrefix}.selectedOption`);
  }

  if (!(answer.timestamp instanceof Date) && typeof answer.timestamp !== 'string') {
    throw new ValidationError('Answer timestamp must be a Date or valid date string', `${fieldPrefix}.timestamp`);
  }

  return true;
}

// Recommendation validation
export function validateRecommendation(recommendation: any): recommendation is Recommendation {
  if (!recommendation || typeof recommendation !== 'object') {
    throw new ValidationError('Recommendation must be an object');
  }

  validateStation(recommendation.station);

  if (typeof recommendation.score !== 'number' || recommendation.score < 0 || recommendation.score > 1) {
    throw new ValidationError('Recommendation score must be a number between 0 and 1', 'score');
  }

  if (typeof recommendation.rank !== 'number' || recommendation.rank < 1) {
    throw new ValidationError('Recommendation rank must be a positive number', 'rank');
  }

  validateRecommendationExplanation(recommendation.explanation, 'explanation');

  return true;
}

function validateRecommendationExplanation(explanation: any, fieldPrefix: string): void {
  if (!explanation || typeof explanation !== 'object') {
    throw new ValidationError('Recommendation explanation must be an object', fieldPrefix);
  }

  if (!Array.isArray(explanation.matchingFeatures)) {
    throw new ValidationError('Matching features must be an array', `${fieldPrefix}.matchingFeatures`);
  }

  if (!Array.isArray(explanation.strengths)) {
    throw new ValidationError('Strengths must be an array', `${fieldPrefix}.strengths`);
  }

  if (!Array.isArray(explanation.considerations)) {
    throw new ValidationError('Considerations must be an array', `${fieldPrefix}.considerations`);
  }
}

// Utility function to safely parse and validate JSON data
export function parseAndValidate<T>(
  jsonString: string,
  validator: (data: any) => data is T,
  errorContext: string
): T {
  try {
    const data = JSON.parse(jsonString);
    if (validator(data)) {
      return data;
    }
    throw new ValidationError(`Invalid ${errorContext} format`);
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Failed to parse ${errorContext}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}