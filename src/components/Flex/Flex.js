import { getProps } from "rc/ThemeProvider";
import "./Flex.sss";

export default function Flex(props) {
  const themeProps = getProps("Flex", props);

  return <div {...themeProps}>{props.children}</div>;
}
