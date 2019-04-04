import usePromise from "hooks/usePromise";
import { getProps } from "rc/ThemeProvider";
import "./Button.sss";

const { useCallback } = React;

export default function Button(props) {
  const [loading, data, error, waitFor] = usePromise();

  const themeProps = getProps("Button", props, { loading });

  const onClick =
    props.onClick &&
    (e => !loading && !props.disabled && waitFor(props.onClick(e)));

  return (
    <button {...themeProps} onClick={useCallback(onClick, [props.onClick])}>
      {props.children}
    </button>
  );
}
