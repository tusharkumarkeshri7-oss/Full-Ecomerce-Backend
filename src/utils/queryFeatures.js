/**
 * QueryFeatures helper for Mongoose queries
 * Implements filtering, full-text searching, sorting, field limiting, and pagination.
 */
export class QueryFeatures {
  /**
   * @param {import('mongoose').Query} mongooseQuery
   * @param {object} queryString - req.query
   */
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString || {};
    this.paginationMeta = {};
  }

  /**
   * Advanced filtering (gte, gt, lte, lt, in, regex)
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Handle operator conversion (gte, gt, lte, lt, in)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|ne)\b/g, (match) => `$${match}`);
    const parsedFilter = JSON.parse(queryStr);

    this.mongooseQuery = this.mongooseQuery.find(parsedFilter);
    return this;
  }

  /**
   * Keyword Search on specified text fields
   * @param {Array<string>} searchFields
   */
  search(searchFields = ['name', 'description']) {
    if (this.queryString.search && searchFields.length > 0) {
      const keyword = this.queryString.search.trim();
      const searchCriteria = searchFields.map((field) => ({
        [field]: { $regex: keyword, $options: 'i' }
      }));
      this.mongooseQuery = this.mongooseQuery.find({ $or: searchCriteria });
    }
    return this;
  }

  /**
   * Sorting results
   */
  sort(defaultSort = '-createdAt') {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort(defaultSort);
    }
    return this;
  }

  /**
   * Field selection / projection
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select('-__v');
    }
    return this;
  }

  /**
   * Pagination with total count computation
   */
  async paginate(model) {
    const page = Math.max(1, parseInt(this.queryString.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(this.queryString.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Clone query to count total matching documents
    const countQuery = model.find(this.mongooseQuery.getQuery());
    const totalDocs = await countQuery.countDocuments();

    const totalPages = Math.ceil(totalDocs / limit);

    this.paginationMeta = {
      totalDocs,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    return this;
  }
}
