import deepmerge from "deepmerge";
import axios from "axios";

export const isTruthy = o => o;
export const isType = type => x => typeof x === type;
export const isBoolean = isType("boolean");
export const isNumber = isType("number");
export const isString = isType("string");
export const isFunction = isType("function");
export const isObject = isType("object");
export const isTruthyObject = o => o && isObject(o);

export const is = y => x => x instanceof y;
export const isPromise = is(Promise);
export const isArray = Array.isArray;

export const extend = (target, ...sources) => {
  sources.forEach(s => {
    s &&
      Object.keys(s).forEach(k => {
        target[k] = s[k];
      });
  });
};

export const debounce = (fn, delay = 0) => {
  let timer = null;

  return function(...args) {
    window.clearTimeout(timer);

    timer = window.setTimeout(fn.bind(this, ...args), delay);
  };
};

export function fetch(options) {
  return axios(options).then(({ data }) => {
    if (!data.success) {
      throw new Error(data.errors.join("\n"));
    }
    return data;
  });
}

export function cx(...args) {
  let classes = [];

  args.forEach(arg => {
    if (arg) {
      var argType = typeof arg;

      if (argType === "string" || argType === "number") {
        classes.push(arg);
      } else if (Array.isArray(arg) && arg.length) {
        var inner = cx(arg);
        if (inner) {
          classes.push(inner);
        }
      } else if (argType === "object") {
        for (var key in arg) {
          if (arg.hasOwnProperty(key)) {
            if (arg[key]) {
              classes.push(key);
            } else {
              let index = classes.indexOf(key);
              if (index !== -1) classes.splice(index, 1);
            }
          }
        }
      }
    }
  });

  return classes.join(" ");
}
