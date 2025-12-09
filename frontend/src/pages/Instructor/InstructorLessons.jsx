import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import AppLayout from '../../components/AppLayout';
import { FiArrowLeft } from 'react-icons/fi';
import './InstructorLessons.css';

const InstructorLessons = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration: '',
    resources: ''
  });

  useEffect(() => {
    loadCoursesAndLessons();
  }, []);

  const loadCoursesAndLessons = async () => {
    try {
      const [coursesRes, lessonsRes] = await Promise.all([
        axiosClient.get('/api/instructor/courses'),
        axiosClient.get('/api/instructor/lessons')
      ]);

      setCourses(coursesRes.data.data || []);
      setLessons(lessonsRes.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLesson) {
        await axiosClient.put(`/api/instructor/lessons/${editingLesson._id}`, {
          ...formData,
          courseId: selectedCourse
        });
      } else {
        await axiosClient.post('/api/instructor/lessons', {
          ...formData,
          courseId: selectedCourse
        });
      }
      loadCoursesAndLessons();
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        content: '',
        duration: '',
        resources: ''
      });
      setEditingLesson(null);
    } catch (error) {
      alert('Error saving lesson: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setSelectedCourse(lesson.courseId);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      duration: lesson.duration,
      resources: lesson.resources || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      try {
        await axiosClient.delete(`/api/instructor/lessons/${lessonId}`);
        loadCoursesAndLessons();
      } catch (error) {
        alert('Error deleting lesson: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) {
    return <AppLayout><div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div></AppLayout>;
  }

  const filteredLessons = selectedCourse ? lessons.filter(l => l.courseId === selectedCourse) : lessons;

  return (
    <AppLayout showGreeting={false}>
      <div className="instructor-lessons">
        <div className="lessons-header">
          <button
            className="back-button"
            onClick={() => navigate('/instructor/dashboard')}
            title="Go back"
          >
            <FiArrowLeft /> Back
          </button>
          <h1>Manage Lessons</h1>
        </div>

        {/* Course Filter */}
        <div className="course-filter">
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="course-select"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course._id} value={course._id}>
                {course.title}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingLesson(null);
              setFormData({
                title: '',
                description: '',
                content: '',
                duration: '',
                resources: ''
              });
              setShowForm(!showForm);
            }}
          >
            {showForm ? 'Cancel' : '+ Add Lesson'}
          </button>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="lesson-form-container">
            <h3>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</h3>
            <form onSubmit={handleSubmit} className="lesson-form">
              <input
                type="text"
                name="title"
                placeholder="Lesson Title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-control"
                required
              />
              <textarea
                name="description"
                placeholder="Lesson Description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-control"
                rows="3"
              />
              <textarea
                name="content"
                placeholder="Lesson Content"
                value={formData.content}
                onChange={handleInputChange}
                className="form-control"
                rows="5"
              />
              <input
                type="text"
                name="duration"
                placeholder="Duration (e.g., 45 min)"
                value={formData.duration}
                onChange={handleInputChange}
                className="form-control"
              />
              <input
                type="text"
                name="resources"
                placeholder="Resources (URLs, attachments)"
                value={formData.resources}
                onChange={handleInputChange}
                className="form-control"
              />
              <div className="form-buttons">
                <button type="submit" className="btn btn-success">
                  {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lessons List */}
        <div className="lessons-list-container">
          {filteredLessons.length === 0 ? (
            <p className="no-data">No lessons found. {selectedCourse && 'Create one to get started!'}</p>
          ) : (
            <div className="lessons-grid">
              {filteredLessons.map(lesson => (
                <div key={lesson._id} className="lesson-card">
                  <div className="lesson-card-header">
                    <h3>{lesson.title}</h3>
                    <span className="lesson-duration">{lesson.duration}</span>
                  </div>
                  <p className="lesson-description">{lesson.description}</p>
                  <p className="lesson-content-preview">{lesson.content?.substring(0, 100)}...</p>
                  <div className="lesson-card-footer">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(lesson)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(lesson._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default InstructorLessons;
