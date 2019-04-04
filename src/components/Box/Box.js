import { getProps } from "rc/ThemeProvider";
// import './Box.sss';

export default function Box(props) {
  const themeProps = getProps("Box", props);

  return <div {...themeProps}>{props.children}</div>;
}
