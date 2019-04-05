// 6c3b837d0c1a075aac92

// 97ea4080913caf42c3e6

export const setToken = token => {
  const github = new Octokit({
    auth: `token ${token}`
  });
  window.github = github;
  return getUser();
};

export const getUser = () => {
  return new Promise((resolve, reject) => {
    window.github.users
      .getAuthenticated()
      .then(data => {
        resolve(data);
      })
      .catch(e => {
        reject(e);
      });
  });
};

let popup;
const toggleLogin = () => {
  const { data } = deref(user);
  if (data) {
    resetUser();
  } else {
    if (popup) {
      popup.location = authUrl;
    } else {
      popup = open(authUrl);
    }
    onmessage = e => {
      try {
        const data = JSON.parse(e.data);
        if (data.github_access_token) {
          setToken(data.github_access_token);
        }
        popup.close();
        popup = null;
      } catch (e) {}
    };
    const checkClose = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(checkClose);
        onmessage = null;
      }
    });
  }
};
