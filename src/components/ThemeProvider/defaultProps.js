const pixelSuffix = value => {
  if (value |> util.isNumber) {
    value = value + "px";
  }
  return value;
};

export default {
  m: value => {
    value = pixelSuffix(value);
    return {
      marginTop: value,
      marginBottom: value,
      marginLeft: value,
      marginRight: value
    };
  },

  my: value => {
    value = pixelSuffix(value);
    return {
      marginTop: value,
      marginBottom: value
    };
  },

  mx: value => {
    value = pixelSuffix(value);
    return {
      marginLeft: value,
      marginRight: value
    };
  },

  mt: value => {
    value = pixelSuffix(value);
    return {
      marginTop: value
    };
  },

  mb: value => {
    value = pixelSuffix(value);
    return {
      marginBottom: value
    };
  },

  ml: value => {
    value = pixelSuffix(value);
    return {
      marginLeft: value
    };
  },

  mr: value => {
    value = pixelSuffix(value);
    return {
      marginRight: value
    };
  },

  p: value => {
    value = pixelSuffix(value);
    return {
      paddingTop: value,
      paddingBottom: value,
      paddingLeft: value,
      paddingRight: value
    };
  },

  py: value => {
    value = pixelSuffix(value);
    return {
      paddingTop: value,
      paddingBottom: value
    };
  },

  px: value => {
    value = pixelSuffix(value);
    return {
      paddingLeft: value,
      paddingRight: value
    };
  },

  pt: value => {
    value = pixelSuffix(value);
    return {
      paddingTop: value
    };
  },

  pb: value => {
    value = pixelSuffix(value);
    return {
      paddingBottom: value
    };
  },

  pl: value => {
    value = pixelSuffix(value);
    return {
      paddingLeft: value
    };
  },

  pr: value => {
    value = pixelSuffix(value);
    return {
      paddingRight: value
    };
  }
};
