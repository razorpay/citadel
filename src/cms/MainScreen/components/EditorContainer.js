import React, { PureComponent } from "react";
import Editor from "../../Editor/Editor";
import remark from "remark";
import remark2react from "remark-react";
import PropTypes from "prop-types";
import "./EditorContainer.sss";

export default class EditorContainer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      title: this.props.title,
      content: this.props.content
    };
  }

  onChange = e => {
    this.setState({
      content: e
    });
  };

  handleSaveButtonOnClick = () => {
    this.props.saveContent(this.state.content);
  };

  handleCancelButtonOnClick = () => {
    this.props.close();
  };

  render() {
    console.log("content", this.props.content);
    return (
      <div
        style={{
          height: "100%"
        }}
      >
        <div className="main-container">
          <Editor
            title={this.state.title}
            content={this.state.content}
            onChange={this.onChange}
          />

          <div className="text-container">
            {
              remark()
                .use(remark2react)
                .processSync(this.state.content).contents
            }
          </div>
        </div>

        <div>
          <button onClick={this.handleSaveButtonOnClick} className="buttons">
            Save
          </button>

          <button onClick={this.handleCancelButtonOnClick} className="buttons">
            Cancel
          </button>
        </div>
      </div>
    );
  }
}

EditorContainer.propTypes = {
  title: PropTypes.string,
  content: PropTypes.string,
  saveContent: PropTypes.func,
  close: PropTypes.func
};
