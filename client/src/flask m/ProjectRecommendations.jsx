import  { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from "react-redux"
import  {resolveProxyUrl} from '../utils/resolveProxyUrl';


function ProjectRecommendations() {
    const { currentUser } = useSelector((state) => state.user)
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = currentUser.id;
    console.log(currentUser.username);
    const flaskUrl = resolveProxyUrl(`/flask/projects/recommendations/${userId}`);



    useEffect(() => {
        console.log(currentUser.id)
        if (userId) {
            setLoading(true);
            axios.get(flaskUrl)
            .then(res => {
                setRecommendations(res.data);
                setLoading(false);
            })
                .catch(err => {
                    console.error("Error fetching project recommendations:", err);
                    setError(err);
                    setLoading(false);
                });
        }
    }, [userId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error?.message || "An unexpected error occurred."}</p>;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Recommended Projects</h2>
            {Array.isArray(recommendations) ? (
            <ul className="space-y-4">
                {recommendations.map(project => (
                    <li key={project.id} className="border p-4 rounded-md shadow-sm">
                        <h3 className="text-lg font-semibold">{project.title}</h3>
                        <p className="text-gray-600">{project.description}</p>
                        <p className="text-sm mt-2">Owner: {project.ownerUsername}</p>
                        <a href={`/project/${project.slug}`} className="text-blue-500 hover:underline mt-2 block">
                            View Project
                        </a>
                    </li>
                ))}
            </ul>
             ) : (
                <p>No recommendations found or an error occurred.</p>
            )}
        </div>
    );
}

export default ProjectRecommendations;