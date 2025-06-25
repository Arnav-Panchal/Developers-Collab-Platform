import { useState, useEffect } from 'react';
import axios from 'axios';
import ProjectCard from './ProjectCard';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelector } from 'react-redux';

import  {resolveProxyUrl} from '../utils/resolveProxyUrl';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalProjects, setTotalProjects] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { currentUser } = useSelector((state) => state.user);
  


  const [filters, setFilters] = useState({
    searchTerm: '',
    technology: '',
    skill: '',
    order: 'desc',
    limit: 12,
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const startIndex = (currentPage - 1) * filters.limit;

        const queryParams = new URLSearchParams({
          startIndex: startIndex.toString(),
          limit: filters.limit.toString(),
          order: filters.order,
          ...(filters.searchTerm && { searchTerm: filters.searchTerm }),
          ...(filters.technology && { technology: filters.technology }),
          ...(filters.skill && { skill: filters.skill }),
        });

        const apiUrl = resolveProxyUrl(`/api/post/getPosts?${queryParams}`);

        const response = await axios.get(apiUrl);

        

        if (response.data && response.data.posts) {
          // Ensure each project has a date property, even if it's null or undefined
          const validatedProjects = response.data.posts.map((project) => ({
            ...project,
            date: project.date || null,
            ownerId: typeof project.ownerId === 'object' ? project.ownerId._id : project.ownerId || '',
          }));
          setProjects(validatedProjects);
          setTotalProjects(response.data.totalPosts || 0);
        } else if (response.data && Array.isArray(response.data)) {
          const validatedProjects = response.data.map((project) => ({
            ...project,
            date: project.date || null,
          }));
          setProjects(validatedProjects);
          setTotalProjects(response.data.length);
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Unable to load projects. Please try again later.');
          setProjects([]);
          setTotalProjects(0);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch projects');
        setProjects([]);
        setTotalProjects(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentPage, filters]);

  const handleSearch = (e) => {
    setFilters({ ...filters, searchTerm: e.target.value });
    setCurrentPage(1);
  };

  const handleFilterChange = (name, value) => {
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalProjects / filters.limit);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={filters.searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.technology}
            onChange={(e) => handleFilterChange('technology', e.target.value)}
            className="md:w-1/4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Technologies</option>
            <option value="React">React</option>
            <option value="Node.js">Node.js</option>
          </select>
          <select
            value={filters.skill}
            onChange={(e) => handleFilterChange('skill', e.target.value)}
            className="md:w-1/4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Skills</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
          </select>
          <select
            value={filters.order}
            onChange={(e) => handleFilterChange('order', e.target.value)}
            className="md:w-1/4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-center py-4 animate-pulse">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Filter className="mx-auto h-12 w-12 mb-4" />
          <p>No projects found. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} currentUser={currentUser} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectList;