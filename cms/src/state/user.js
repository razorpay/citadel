import { Atom, swap, useAtom, deref } from "hooks/useAtom";
// import Github, { gitHub } from '../github';

const authUrl =
  "https://github.com/login/oauth/authorize?client_id=6c3b837d0c1a075aac92&scope=repo";
// 6c3b837d0c1a075aac92

// 97ea4080913caf42c3e6

const initialState = {
  loading: false,
  token: null,
  data: null
};

const user = Atom.of(initialState);
const resetUser = () => swap(user, state => initialState);

const setToken = token => {
  swap(user, state => ({
    ...state,
    loading: true,
    token
  }));

  const github = new Octokit({
    auth: `token ${token}`
  });

  // new Github(token);

  window.github = github;

  getUser();
};

const getUser = () => {
  window.github.users
    .getAuthenticated()
    .then(data => {
      swap(user, state => ({
        ...state,
        loading: false,
        data
      }));
    })
    .catch(e => {
      resetUser();
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

export default () => {
  const { loading, token, data } = useAtom(user);
  return [data, toggleLogin, !!token, loading];
};
