const inputProps = ["disabled", "name", "value", "type"];

const defaultMap = {
  Button: inputProps,
  Input: [
    ...inputProps,
    "placeholder",
    "autoFocus",
    "required",
    "pattern",
    "readOnly"
  ],
  Flex: [""]
};

Object.keys(defaultMap).forEach(component => {
  defaultMap[component] = defaultMap[component].reduce((o, k) => {
    o[k] = String;
    return o;
  }, {});
});

export default defaultMap;
