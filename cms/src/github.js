const github = new Octokit({
  auth: ""
});

// 274f7af3e67a1fc805a8c3bdf4303bf679958345
window.github = github;

github.hook.wrap("request", async (request, options) => {
  return request(options).then(response => response.data);
});

export default github;
