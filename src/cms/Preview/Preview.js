import "./Preview.sss";
import parse from "../../parser/parser";
import React, {PureComponent} from 'react';

export default class Preview extends PureComponent {
  constructor(props) {
    super(props);
  }

  componentDidCatch() {}

  render() {
    const entry = this.props.entry.toJS().data;
    let html = "";
    try {
      html = parse(entry.body);
    } catch (e) {
      html = e.message;
    }
    return (
      <div
        id="content"
        class="Preview"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
}
