const { useState, useEffect } = React;

const usePromise = (loading, error, data) => {
  const [state, setState] = useState({
    loading,
    error,
    data
  });

  let isMounted = false;
  useEffect(() => {
    isMounted = true;
    return () => {
      isMounted = false;
    };
  }, []);

  const request = promise => {
    if (promise |> util.isPromise) {
      let data, error;
      return promise
        .then(response => {
          if (response && response.error) {
            error = response.error;
          } else {
            data = response;
          }
        })
        .catch(e => {
          error = e;
        })
        .then(() => {
          if (isMounted) {
            setState({
              loading: false,
              data,
              error
            });
          }
        });
    }
    return promise;
  };

  return [state.loading, state.error, state.data, request];
};

export default usePromise;
