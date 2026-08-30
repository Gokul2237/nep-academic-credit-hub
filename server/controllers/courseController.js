const { Course } = require('../models/Course');
const Institution = require('../models/Institution');
const ApiResponse = require('../utils/apiResponse');

/**
 * Create a new course in the catalog
 * POST /api/courses
 * Access: Institution (for own institution), Admin (for any institution)
 */
const createCourse = async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      description,
      credits,
      courseLevel = 'Undergraduate',
      department,
      semester,
      institutionId: bodyInstitutionId,
    } = req.body;

    // 1. Resolve institution ID
    let targetInstitutionId = null;
    if (req.user.role === 'institution') {
      targetInstitutionId = req.user.institutionId;
      if (!targetInstitutionId) {
        return ApiResponse.error(
          res,
          'Your user account is not linked to any institution record.',
          400
        );
      }
    } else if (req.user.role === 'admin') {
      targetInstitutionId = bodyInstitutionId;
      if (!targetInstitutionId) {
        return ApiResponse.error(res, 'Admin must specify target institutionId.', 400);
      }
    } else {
      return ApiResponse.error(res, 'Only institutions and admins can create courses.', 403);
    }

    // 2. Validate Institution exists
    const institutionExists = await Institution.findById(targetInstitutionId);
    if (!institutionExists) {
      return ApiResponse.error(res, 'Target institution does not exist.', 404);
    }

    // 3. Validate credit value
    const numericCredits = Number(credits);
    if (!numericCredits || numericCredits < 1 || numericCredits > 20) {
      return ApiResponse.error(
        res,
        'Invalid credits. Course credits must be a positive integer between 1 and 20.',
        400
      );
    }

    // 4. Check for duplicate course code within this institution
    const duplicate = await Course.findOne({
      institutionId: targetInstitutionId,
      courseCode: String(courseCode).toUpperCase().trim(),
    });

    if (duplicate) {
      return ApiResponse.error(
        res,
        `A course with code '${courseCode.toUpperCase()}' already exists for this institution.`,
        409
      );
    }

    // 5. Create Course
    const course = await Course.create({
      courseCode: String(courseCode).toUpperCase().trim(),
      courseName: courseName.trim(),
      description: description ? description.trim() : '',
      credits: numericCredits,
      courseLevel,
      department: department.trim(),
      semester: Number(semester),
      institutionId: targetInstitutionId,
      isActive: true,
    });

    return ApiResponse.created(res, course, 'Course created successfully in catalog.');
  } catch (error) {
    console.error('Create Course Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to create course.', 500);
  }
};

/**
 * Get catalog courses with search and filtering
 * GET /api/courses
 * Access: All authenticated roles (Students, Institutions, Admins)
 */
const getCourses = async (req, res) => {
  try {
    const {
      institutionId,
      department,
      semester,
      courseLevel,
      search,
      isActive,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // By default, only active courses unless admin or institution requests inactive
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else if (req.user.role === 'student') {
      query.isActive = true;
    }

    if (institutionId) {
      query.institutionId = institutionId;
    } else if (req.user.role === 'institution' && !req.query.allInstitutions) {
      // Default institution view to own courses
      query.institutionId = req.user.institutionId;
    }

    if (department) {
      query.department = new RegExp(department, 'i');
    }

    if (semester) {
      query.semester = Number(semester);
    }

    if (courseLevel) {
      query.courseLevel = courseLevel;
    }

    if (search) {
      query.$or = [
        { courseCode: new RegExp(search, 'i') },
        { courseName: new RegExp(search, 'i') },
        { department: new RegExp(search, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('institutionId', 'name code type naacAccreditation')
      .sort({ courseCode: 1 })
      .skip(skip)
      .limit(Number(limit));

    return ApiResponse.paginated(
      res,
      courses,
      total,
      page,
      limit,
      'Courses retrieved successfully.'
    );
  } catch (error) {
    console.error('Get Courses Error:', error);
    return ApiResponse.error(res, 'Failed to fetch courses.', 500);
  }
};

/**
 * Get single course by ID
 * GET /api/courses/:id
 */
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      'institutionId',
      'name code type naacAccreditation contactEmail'
    );

    if (!course) {
      return ApiResponse.error(res, 'Course not found.', 404);
    }

    return ApiResponse.success(res, course, 'Course details retrieved successfully.');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to fetch course details.', 500);
  }
};

/**
 * Update course details
 * PUT /api/courses/:id
 * Access: Institution (own courses only), Admin (any course)
 */
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return ApiResponse.error(res, 'Course not found.', 404);
    }

    // Tenant Isolation Check
    if (
      req.user.role === 'institution' &&
      (!req.user.institutionId ||
        course.institutionId.toString() !== req.user.institutionId.toString())
    ) {
      return ApiResponse.error(
        res,
        'Access denied. You cannot modify courses belonging to another institution.',
        403
      );
    }

    const {
      courseName,
      description,
      credits,
      courseLevel,
      department,
      semester,
      isActive,
    } = req.body;

    if (credits !== undefined) {
      const numericCredits = Number(credits);
      if (numericCredits < 1 || numericCredits > 20) {
        return ApiResponse.error(res, 'Credits must be between 1 and 20.', 400);
      }
      course.credits = numericCredits;
    }

    if (courseName) course.courseName = courseName.trim();
    if (description !== undefined) course.description = description.trim();
    if (courseLevel) course.courseLevel = courseLevel;
    if (department) course.department = department.trim();
    if (semester) course.semester = Number(semester);
    if (isActive !== undefined) course.isActive = Boolean(isActive);

    await course.save();

    return ApiResponse.success(res, course, 'Course updated successfully.');
  } catch (error) {
    console.error('Update Course Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to update course.', 500);
  }
};

/**
 * Delete or deactivate course
 * DELETE /api/courses/:id
 * Access: Institution (own courses only), Admin (any course)
 */
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return ApiResponse.error(res, 'Course not found.', 404);
    }

    // Tenant Isolation Check
    if (
      req.user.role === 'institution' &&
      (!req.user.institutionId ||
        course.institutionId.toString() !== req.user.institutionId.toString())
    ) {
      return ApiResponse.error(
        res,
        'Access denied. You cannot delete courses belonging to another institution.',
        403
      );
    }

    // Soft delete by setting isActive to false
    course.isActive = false;
    await course.save();

    return ApiResponse.success(res, { id: course._id }, 'Course deactivated successfully.');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to deactivate course.', 500);
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
