export default options =>
  axios(options)
    .then(({ data }) => data)
    .catch(error => ({ error }));
