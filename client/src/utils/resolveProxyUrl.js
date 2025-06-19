// src/utils/resolveProxyUrl.js

const proxyMap = {
    '/login/oauth/access_token': import.meta.env.VITE_PROXY_LOGIN_OAUTH_ACCESS_TOKEN,
    '/flask': import.meta.env.VITE_PROXY_FLASK,
    '/user/repos': import.meta.env.VITE_PROXY_USER_REPOS,
    '/user/emails': import.meta.env.VITE_PROXY_USER_EMAILS,
    '/user': import.meta.env.VITE_PROXY_USER,
    '/api': import.meta.env.VITE_PROXY_API,
  };
  
  export function resolveProxyUrl(endpoint) {
    for (const prefix in proxyMap) {
      if (endpoint.startsWith(prefix)) {
        return endpoint.replace(prefix, proxyMap[prefix]);
      }
    }
    return endpoint;
  }
  