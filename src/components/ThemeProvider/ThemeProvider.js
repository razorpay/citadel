import { cx } from "util";
import defaultAttribs from "./defaultAttribs";
import defaultProps from "./defaultProps";

const useContext = React.useContext;
export const ThemeContext = React.createContext();

export const getProps = (name, props, state) => {
  const mergedProps = {};
  const themeProps = useContext(ThemeContext)[name] || {};
  const attribs = defaultAttribs[name] || {};
  let style = {};

  const className =
    state &&
    Object.keys(state).reduce((className, stateKey) => {
      const stateVal = state[stateKey];
      if (stateVal) {
        className["is-" + stateKey] = true;
      }
      return className;
    }, {});

  mergedProps.className = cx(
    name,
    props && (props.class || props.className),
    className
  );

  props &&
    Object.keys(props).forEach(prop => {
      if (prop.slice(0, 2) === "on" || (attribs && attribs[prop])) {
        mergedProps[prop] = props[prop];
      } else if (themeProps[prop]) {
        mergedProps[prop] = String(props[prop]);
      } else if (defaultProps[prop]) {
        style = { ...style, ...defaultProps[prop](props[prop]) };
      }
    });

  mergedProps.style = style;
  return mergedProps;
};

export default function ThemeProvider(props) {
  let value = processProps(props.props || {});
  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
}

const processProps = componentProps => {
  const propMap = {};
  Object.keys(componentProps).forEach(component => {
    propMap[component] = {};
    componentProps[component].forEach(prop => {
      propMap[component][prop] = true;
    });
  });
  return propMap;
};
