import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ProjectCard from './ProjectCard';
import { useSelector } from "react-redux"
import  {resolveProxyUrl} from '../utils/resolveProxyUrl';

interface Project {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  ownerUsername: string;
}

interface Teammate {
  id: string;
  username: string;
  profilePicture: string;
  email: string;
  skills: string[];
}

const TeammateRecommendations: React.FC = () => {
  // For demo purposes, we'll simulate a current user
  // const currentUser = ;
  const { currentUser } = useSelector((state) => state.user)
  const [posts, setPosts] = useState<Project[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, Teammate[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const userId = currentUser.username;

  // Fetch all posts by the current user
  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const apiUrl = resolveProxyUrl(`/flask/posts/user/${userId}`);
        const res = await axios.get(apiUrl);
        if (Array.isArray(res.data)) {
          console.log("Fetched Posts:", res.data);
          setPosts(res.data);
        } else {
          throw new Error("Received invalid data format");
        }
      } catch (err) {
        console.error("Error fetching user posts:", err);
        setError(err as Error);
        setPosts([]);
      }
    };

    if (userId) {
      fetchUserPosts();
    }
  }, [userId]);

  // Fetch teammate recommendations for each post
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        if (!Array.isArray(posts)) {
          throw new Error("Posts data is not an array");
        }
        
        const results: Record<string, Teammate[]> = {};
        
        await Promise.all(
          posts.map(async (post) => {
            try {
              const apiUrl1 = resolveProxyUrl(`/flask/users/recommendations/post/${post.id}`);
              const res = await axios.get(apiUrl1);
              if (Array.isArray(res.data)) {
                console.log(`Recommendations for Post (${post.id}):`, res.data);
                results[post.id] = res.data;
              } else {
                throw new Error(`Invalid data format for post ${post.id}`);
              }
            } catch (err) {
              console.error(`Error fetching recommendations for post ${post.id}:`, err);
              results[post.id] = [];
            }
          })
        );
        
        setRecommendations(results);
      } catch (err) {
        console.error("Error fetching teammate recommendations:", err);
        setError(err as Error);
      }
      setLoading(false);
    };

    if (posts.length > 0) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [posts]);

  if (loading) return <LoadingSpinner size="lg" />;
  
  if (error) return (
    <div className="text-center py-12">
      <p className="text-destructive">Error: {error?.message || "An unexpected error occurred."}</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="px-6 py-8 md:py-12 md:px-12 max-w-7xl mx-auto"
    >
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
          <Users size={28} />
        </div>
        <h1 className="text-4xl font-medium mb-4">Teammate Recommendations</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-balance">
          Find the perfect teammates for your projects based on skill matching and collaborative potential.
        </p>
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center py-12 glass rounded-xl">
          <p className="text-muted-foreground">You don't have any projects yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <ProjectCard
              key={post.id}
              project={post}
              teammates={recommendations[post.id] || []}
              index={index}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default TeammateRecommendations;