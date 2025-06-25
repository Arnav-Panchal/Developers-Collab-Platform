import axios from "axios";
import  {resolveProxyUrl} from '../utils/resolveProxyUrl';



let result=null;

async function getAccessToken() {
  const code = new URLSearchParams(window.location.search).get('code');
  if (!code) return;

  const apiUrl = resolveProxyUrl('/api/github/exchange-token')

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) throw new Error('Failed to fetch token');

    const data = await res.json();
    console.log("Access Token:", data.access_token);

    return data.access_token;
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function getUserData(access_token) {

  const apiUrl1 = resolveProxyUrl('/user')
  const userResponse = await axios.get(
    apiUrl1,
    {
        headers: {
            'Authorization':`Bearer ${access_token}`
        }
    }

) 

const userData = userResponse.data; 



const apiUrl3 = resolveProxyUrl('/user/repos');



const repoResponse = await axios.get(
  apiUrl3,
  {
      headers: {
          'Authorization':`Bearer ${access_token}`
      }
  }

) 

const repoData = repoResponse.data; 

console.log("repo :"+ repoData);

const apiUrl4 = resolveProxyUrl('/user/emails')

const emailResponse = await axios.get(apiUrl4, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    const emails = emailResponse.data;

    // Find the primary, verified email
    const primaryEmail = emails.find(email => email.primary && email.verified);

    if(primaryEmail){
      userData.email=primaryEmail.email
    }
  
    result={
      userData:userData,
      repoData:repoData
    }



 
return  result;

}



export  {getAccessToken, getUserData, result}



