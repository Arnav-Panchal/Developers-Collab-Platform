
import { getAccessToken,getUserData} from './callback';
import { useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { signInSuccess } from '../redux/user/userSlice';
 import { useDispatch } from 'react-redux';
 import axios from "axios"
import  {resolveProxyUrl} from '../utils/resolveProxyUrl';

const Callback = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    console.log("in callback")
  //url => code => access_token => local
//    const navigate = useNavigate()
  useEffect(() => {
    async function fetchToken() {
      try {
        const token = await getAccessToken()
        console.log(token)
        
        const u = await getUserData(token); 
        const user=u.userData;
        // const repo=u.repoData;
      
        const apiUrl = resolveProxyUrl('/api/auth/github');

        
        const  response =axios.post(apiUrl,{
            email:user.email,
            userdata:user
          })

        console.log('User data received:', user);
        
         dispatch(signInSuccess((await response).data.user));
         navigate('/');
        
  //       
          console.log("User ID:", user.id);              // Numeric GitHub User ID
  console.log("Username:", user.login);          // GitHub Username (login handle)
  console.log("Profile URL:", user.html_url);    // URL to GitHub Profile
  console.log("Avatar URL:", user.avatar_url);   // URL to Profile Picture
  console.log("Bio:", user.bio);                 // User Bio (if set)
  console.log("Company:", user.company);         // Company (if set)
  console.log("Location:", user.location);       // User Location (if set)
  console.log("Email:", user.email);             // User Email (if public or available)
  console.log("Public Repos:", user.public_repos);  // Number of Public Repositories
  console.log("Followers:", user.followers);     // Number of Followers
  console.log("Following:", user.following);     // Number of Users the User is Following
  console.log("Created at:", user.created_at);   // Account Creation Date
  console.log("Updated at:", user.updated_at);
            // Store username instead of numeric ID
  
  
  
        // localStorage.setItem('access_token',token)
        // localStorage.setItem('Userid',user.id)
        // localStorage.setItem('Username', user.login);
        // navigate('/')
      } catch (error) {
        console.log('err: ',error)
      }
    }
    fetchToken()
  },[])
  
  return (
    <div>Callback</div>
  )
}

export default Callback