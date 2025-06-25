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
  const userResponse = await axios.get(
    "/user",
    {
        headers: {
            'Authorization':`Bearer ${access_token}`
        }
    }

) 

const userData = userResponse.data; 

const repoResponse = await axios.get(
  "/user/repos",
  {
      headers: {
          'Authorization':`Bearer ${access_token}`
      }
  }

) 

const repoData = repoResponse.data; 

console.log("repo :"+ repoData);

const emailResponse = await axios.get('/user/emails', {
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

// //for sendiung data to backend
// const em=userData.email;
// const  response=axios.post('/api/auth/github',{
//   email:em,
//   userdata:userData
// })

 
return  result;

}



export  {getAccessToken, getUserData, result}



// import axios from "axios"

// let result=null;

// async function getAccessToken() {
//   const code = new URLSearchParams(window.location.search).get('code');
//   if (!code) throw new Error('Authorization code not found');

//   console.log("In getAccessToken, code:", code);

//   // Use VITE_API_BASE if set, else fallback to relative '/api'
 
//   const res = await axios.post(`api/exchange-token`, { code });

//   console.log("Response from GitHub:", res.data);
//   return res.data.access_token;
// }



// async function getUserData(access_token) {
//   const userResponse = await axios.get(
//     "/user",
//     {
//         headers: {
//             'Authorization':`Bearer ${access_token}`
//         }
//     }

// ) 

// const userData = userResponse.data; 

// const repoResponse = await axios.get(
//   "/user/repos",
//   {
//       headers: {
//           'Authorization':`Bearer ${access_token}`
//       }
//   }

// ) 

// const repoData = repoResponse.data; 

// console.log("repo :"+ repoData);

// const emailResponse = await axios.get('/user/emails', {
//       headers: {
//         Authorization: `Bearer ${access_token}`,
//       },
//     });
    
//     const emails = emailResponse.data;

//     // Find the primary, verified email
//     const primaryEmail = emails.find(email => email.primary && email.verified);

//     if(primaryEmail){
//       userData.email=primaryEmail.email
//     }
  
//     result={
//       userData:userData,
//       repoData:repoData
//     }

// // //for sendiung data to backend
// // const em=userData.email;
// // const  response=axios.post('/api/auth/github',{
// //   email:em,
// //   userdata:userData
// // })

 
// return  result;

// }



// export  {getAccessToken, getUserData, result}