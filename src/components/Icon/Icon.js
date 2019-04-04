import "./Icon.sss";

export default props => (
  <span
    className={
      "Icon " +
      Object.keys(props)
        .map(p => "Icon-" + p)
        .join(" ")
    }
  />
);
