// frontend/src/components/DisplayProjects.jsx

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import  {resolveProxyUrl} from '../utils/resolveProxyUrl';

export default function DisplayProjects() {
  const { currentUser } = useSelector((state) => state.user);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const apiUrl = resolveProxyUrl(`/api/projects/user?email=${currentUser.email}`);
        const res = await axios.get(apiUrl);
        setProjects(res.data);
      } catch (err) {
        setError("Failed to fetch projects.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.email) fetchProjects();
  }, [currentUser]);

  if (loading) return <p className="text-center">Loading projects...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="p-5">
    <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        My GitHub Projects
    </h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
      {projects.length === 0 ? (
        <p className="text-center col-span-full">No projects found.</p>
      ) : (
        projects.map((project) => (
          <div key={project.repoId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-2 text-blue-700 dark:text-blue-400">
              {project.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">{project.description || "No description"}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Language: {project.language || "N/A"}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-300 underline"
            >
              View Repository
            </a>
          </div>
        ))
      )}
    </div>
    </div>
  );
}
