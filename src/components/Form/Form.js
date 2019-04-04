import usePromise from "hooks/usePromise";
// import { className } from 'postcss-selector-parser';
import { debounce, combineStyles } from "util";
import { ThemeContext } from "../ThemeProvider";
const { useContext, useState, useEffect } = React;

export default function Form(props) {
  const [state, setState] = useState({
    mature: false
  });
  const { loading, data, request } = usePromise();

  function onSubmit(e) {
    e.preventDefault();

    // __evaluateIfError is called to make sure the all the fields are valid
    // also children can change without the notice of parent
    if (__evaluateIfError()) {
      return;
    }

    let { beforeSubmit, validator, dataType } = props;

    let form = e.target;
    let data = dataType === "form" ? new FormData(form) : serialize(form);

    if (validator) {
      if (validator(data, form)) {
        return setState({
          mature: true
        });
      }
    }

    if (loading) return;

    // if a before submit hook is provided, invoke it
    if (beforeSubmit) {
      let beforePromise = beforeSubmit.call(this, data);

      // if before submit hook returns a promise, submit on resolution
      if (beforePromise instanceof Promise) {
        return beforePromise.then(submit(data));
      }
    }
    return submit(data);
  }

  function submit(data) {
    return request(props.onSubmit(data));
  }

  function serialize(form) {
    let data = {};
    let lastData;
    Array.prototype.forEach.call(form.querySelectorAll("[name]"), el => {
      const { name, value, type } = el;

      if (type === "radio" && !el.checked) {
        return;
      }

      name.split(".").reduce((parent, key, i, arr) => {
        if (i === arr.length - 1) {
          parent[key] = value;
        } else {
          if (typeof parent[key] !== "object") parent[key] = {};
          return parent[key];
        }
      }, data);
    });

    const keys = Object.keys(data);
    const d = {};

    keys.forEach(k => {
      if (data.hasOwnProperty(k)) {
        let nestedKeys = k.match(/\[(\d+)\]\[(\w+)\]/);

        if (!nestedKeys || nestedKeys.length < 3) {
          // Supports only mainKey[0][something] kind of format as of now
          d[k] = data[k];
        } else {
          const _index = nestedKeys[1];
          const _realKey = nestedKeys[2];
          const parent = k.replace(nestedKeys[0], "");

          if (d.hasOwnProperty(parent)) {
            let existingObj = d[parent][_index];

            if (!existingObj) {
              d[parent][_index] = {};
            }

            d[parent][_index][_realKey] = data[k];
          } else {
            d[parent] = {
              [_index]: {
                [_realKey]: data[k]
              }
            };
          }
        }
      }
    });

    return d;
  }

  function onChange(currentTarget) {
    props.onChange && props.onChange(currentTarget);

    setTimeout(() => {
      evaluateIfError();
    }, 10);
  }

  const evaluateIfError = debounce(__evaluateIfError, 50);

  function __evaluateIfError() {
    const hasInvalidField = document.body.querySelector(".Input.is-invalid");

    setState({ hasError: hasInvalidField });

    return hasInvalidField;
  }

  let context = useContext(ThemeContext),
    style = combineStyles(context, props, "form"),
    style2 = combineStyles(context, props, "fieldset");
  //TODO:
  // Find to way to combine styles for a component
  // consisting of multiple components as child
  let { className, children } = props;

  return (
    <form
      style={style}
      className={className}
      onSubmit={onSubmit}
      onChange={onChange}
      noValidate
    >
      <fieldset style={style2} disabled={loading}>
        {children}
      </fieldset>
    </form>
  );
}

export const MultipartForm = props => <Form {...props} dataType={"form"} />;
