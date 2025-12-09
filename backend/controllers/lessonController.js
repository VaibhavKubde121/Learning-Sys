const Lesson = require('../models/lessonModel');
const Course = require('../models/courseModel');

// @desc    Create a lesson
// @route   POST /api/lessons
// @access  Private (Instructor/Admin)
exports.createLesson = async (req, res) => {
    try {
        const { courseId, title, description, videoUrl, content, duration, order } = req.body;

        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Verify user is the instructor of this course
        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to add lessons to this course' });
        }

        const lesson = await Lesson.create({
            course: courseId,
            title,
            description,
            videoUrl,
            content,
            duration,
            order: order || 0
        });

        // Add lesson to course
        course.lessons.push(lesson._id);
        await course.save();

        res.status(201).json(lesson);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all lessons for a course
// @route   GET /api/lessons?courseId=:courseId
// @access  Public
exports.getLessons = async (req, res) => {
    try {
        const { courseId } = req.query;
        const query = courseId ? { course: courseId } : {};
        const lessons = await Lesson.find(query).sort('order');
        res.json(lessons);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get a single lesson
// @route   GET /api/lessons/:id
// @access  Public
exports.getLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id).populate('course');
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.json(lesson);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a lesson
// @route   PUT /api/lessons/:id
// @access  Private (Instructor/Admin)
exports.updateLesson = async (req, res) => {
    try {
        let lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Check authorization
        const course = await Course.findById(lesson.course);
        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this lesson' });
        }

        lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.json(lesson);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a lesson
// @route   DELETE /api/lessons/:id
// @access  Private (Instructor/Admin)
exports.deleteLesson = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Check authorization
        const course = await Course.findById(lesson.course);
        if (course.instructor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this lesson' });
        }

        // Remove lesson from course
        await Course.findByIdAndUpdate(lesson.course, { $pull: { lessons: lesson._id } });

        await Lesson.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lesson deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
