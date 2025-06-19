import { useState } from 'react';
import { useSelector } from 'react-redux';
import  {resolveProxyUrl} from '../utils/resolveProxyUrl';

const ProjectPost = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [technologies, setTechnologies] = useState([]);
    const [skills, setSkills] = useState([]);
    const [teamSize, setTeamSize] = useState('');
    const [customTeamSize, setCustomTeamSize] = useState('');
    const [responsibilities, setResponsibilities] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);

    const { currentUser } = useSelector((state) => state.user);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title || !description || !technologies.length || !skills.length || (!teamSize && !customTeamSize) || !responsibilities || !startDate || !endDate) {
            setErrorMessage('Please fill in all fields.');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setErrorMessage('End date must be after the start date.');
            return;
        }

        const formData = {
            title,
            description,
            technologies,
            skills,
            teamSize: customTeamSize || teamSize,
            responsibilities,
            startDate,
            endDate,
            ownerId: currentUser?.id?.toString() || currentUser?._id?.toString() || '',
            ownerUsername: currentUser.username,
            ownerPic: currentUser.profilePicture,
        };

        try {
            const apiUrl = resolveProxyUrl('/api/post/create');
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.message || 'Failed to create the project posting.');
                return;
            }

            resetForm();
            alert('Project posted successfully!');

        } catch (error) {
            setErrorMessage('Something went wrong while posting the project.');
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setTechnologies([]);
        setSkills([]);
        setTeamSize('');
        setCustomTeamSize('');
        setResponsibilities('');
        setStartDate('');
        setEndDate('');
        setErrorMessage(null);
    };

    const addTechnology = (e) => {
        const value = e.target.value.trim();
        if (e.key === 'Enter' && value && !technologies.includes(value)) {
            setTechnologies([...technologies, value]);
            e.target.value = '';
        }
    };

    const removeTechnology = (tech) => {
        setTechnologies(technologies.filter((t) => t !== tech));
    };

    const addSkill = (e) => {
        const value = e.target.value.trim();
        if (e.key === 'Enter' && value && !skills.includes(value)) {
            setSkills([...skills, value]);
            e.target.value = '';
        }
    };

    const removeSkill = (skill) => {
        setSkills(skills.filter((s) => s !== skill));
    };

    return (
        <div className="project-post m-6 max-w-md mx-auto p-4 w-full border border-gray-300 rounded-md shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Create a New Project Posting</h2>
            {errorMessage && <div className="text-red-600 font-semibold mb-2">{errorMessage}</div>}
            <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="mb-3">
                    <label className="block mb-1 text-sm">Title:</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border border-gray-300 bg-gray-50 rounded-md p-1 text-sm" />
                </div>

                {/* Description */}
                <div className="mb-3">
                    <label className="block mb-1 text-sm">Description:</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full border border-gray-300 bg-gray-50 rounded-md p-1 h-20 text-sm" />
                </div>

                {/* Technologies */}
                <div className="mb-3">
                    <label className="block mb-1 text-sm">Technologies Needed:</label>
                    <div className="flex flex-wrap gap-1 mb-2">
                        {technologies.map((tech) => (
                            <span key={tech} className="bg-blue-200 text-blue-800 rounded-full px-2 py-1 text-xs flex items-center">
                                {tech}<button type="button" onClick={() => removeTechnology(tech)} className="ml-1 text-red-600 text-xs">&times;</button>
                            </span>
                        ))}
                    </div>
                    <input type="text" placeholder="Add tech & press Enter" onKeyDown={addTechnology} className="w-full border border-gray-300 bg-gray-50 rounded-md p-1 text-sm" />
                </div>

                {/* Skills */}
                <div className="mb-3">
                    <label className="block mb-1 text-sm">Skills Required:</label>
                    <div className="flex flex-wrap gap-1 mb-2">
                        {skills.map((skill) => (
                            <span key={skill} className="bg-blue-200 text-blue-800 rounded-full px-2 py-1 text-xs flex items-center">
                                {skill}<button type="button" onClick={() => removeSkill(skill)} className="ml-1 text-red-600 text-xs">&times;</button>
                            </span>
                        ))}
                    </div>
                    <input type="text" placeholder="Add skill & press Enter" onKeyDown={addSkill} className="w-full border border-gray-300 bg-gray-50 rounded-md p-1 text-sm" />
                </div>

                {/* Team Size */}
                <div className="mb-3">
                    <label className="block mb-1 text-sm">Team Size:</label>
                    <select value={teamSize} onChange={(e) => { setTeamSize(e.target.value); setCustomTeamSize(''); }} className="w-full border border-gray-300 bg-gray-50 rounded-md p-1 text-sm">
                        <option value="">Select Team Size</option>
                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                        <option value="custom">Custom</option>
                    </select>
                    {teamSize === 'custom' && (
                        <input type="number" value={customTeamSize} onChange={(e) => setCustomTeamSize(e.target.value)} className="mt-1 w-full border border-gray-300 bg-gray-50 rounded-md p-1 text-sm" placeholder="Enter custom size" />
                    )}
                </div>

                {/* Responsibilities */}
                <div className="mb-3">
                    <label className="block mb-1 text-sm">Responsibilities:</label>
                    <textarea value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} required className="w-full border border-gray-300 bg-gray-50 rounded-md p-1 h-20 text-sm" />
                </div>

                {/* Dates */}
                <div className="mb-3">
                    <label className="block mb-1 text-sm">Project Timeline:</label>
                    <div className="flex gap-2">
                        <div className="w-full">
                            <label className="text-sm">Start:</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-gray-300 bg-gray-50 rounded-md p-1 text-sm" />
                        </div>
                        <div className="w-full">
                            <label className="text-sm">End:</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-gray-300 bg-gray-50 rounded-md p-1 text-sm" />
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <button type="submit" className="w-full bg-blue-600 text-white rounded-md px-4 py-2 mt-4">Post Project</button>
                <button type="button" onClick={resetForm} className="w-full bg-gray-200 text-gray-800 rounded-md px-4 py-2 mt-2">Reset</button>
            </form>
        </div>
    );
};

export default ProjectPost;
