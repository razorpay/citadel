import "./Editor.sss";
import { cx } from "util";
import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import Dropzone from "react-dropzone";
import ValidationHelper from "../../helper/ValidationHelper";

export default class Editor extends PureComponent {
  state = {
    focus: false,
    value: "",
    images: [],
    isCodeFormatterEnabled: false,
    isBoldFormatterEnabled: false,
    isItalicsFormatterEnabled: false
  };

  onFocus = () => {
    this.setState({ focus: true });
    this.props.setActiveStyle();
  };

  onBlur = () => {
    this.setState({ focus: false });
    this.props.setInactiveStyle();
  };

  onChange = e => {
    this.props.onChange(e.target.value);
  };

  onDropAccepted = images => {
    console.log("images", images);
    images.map(img => {
      img.preview = URL.createObjectURL(img);
    });
    this.setState(
      {
        images
      },
      () => {
        console.log("images modified", images);
      }
    );
  };

  addCodeFormatter = () => {
    this.setState(
      {
        isCodeFormatterEnabled: !this.state.isCodeFormatterEnabled,
        isBoldFormatterEnabled: false,
        isItalicsFormatterEnabled: false
      },
      () => {
        console.log(
          "isCodeFormatterEnabled",
          this.state.isCodeFormatterEnabled
        );
      }
    );
  };

  addBoldFormatter = () => {
    this.setState(
      {
        isBoldFormatterEnabled: !this.state.isBoldFormatterEnabled,
        isItalicsFormatterEnabled: false,
        isCodeFormatterEnabled: false
      },
      () => {
        console.log(
          "isBoldFormatterEnabled",
          this.state.isBoldFormatterEnabled
        );
      }
    );
  };

  addItalicsFormatter = () => {
    this.setState(
      {
        isItalicsFormatterEnabled: !this.state.isItalicsFormatterEnabled,
        isCodeFormatterEnabled: false,
        isBoldFormatterEnabled: false
      },
      () => {
        console.log(
          "isItalicsFormatterEnabled",
          this.state.isItalicsFormatterEnabled
        );
      }
    );
  };

  render() {
    console.log("this.state", this.state);
    const className = cx("Editor", { "is-focus": this.state.focus });
    let content = this.state.isCodeFormatterEnabled ? (
      <code>{this.props.content}</code>
    ) : this.state.isBoldFormatterEnabled ? (
      <b>{this.props.content}</b>
    ) : this.state.isItalicsFormatterEnabled ? (
      <i>{this.props.content}</i>
    ) : (
      this.props.content
    );
    return (
      <div className={className}>
        <div className="title-container">
          Title
          <textarea
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            onChange={this.onChange}
            placeholder="Title"
            className="title-container"
          >
            {this.props.title}
          </textarea>
        </div>

        <div className="content-container">
          Content
          <div>
            <Dropzone onDrop={this.onDropAccepted}>
              {({ getRootProps, getInputProps }) => (
                <section>
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <p>
                      Drag 'n' drop some files here, or click to select files
                    </p>
                  </div>
                </section>
              )}
            </Dropzone>
            <span className="formatters" onClick={this.addBoldFormatter}>
              <b>B</b>
            </span>
            <span className="formatters" onClick={this.addItalicsFormatter}>
              <i>I</i>
            </span>
            <span onClick={this.addCodeFormatter} className="formatters">
              Code
            </span>

            {!ValidationHelper.isEmpty(this.state.images) && (
              <div>
                <div>Images added:</div>

                {this.state.images.map(img => {
                  return (
                    <div
                      style={{
                        background: `url(${
                          img.preview
                        }) center center/cover no-repeat`,
                        display: "inline-block",
                        width: "80px",
                        height: "80px",
                        margin: "12px"
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
          <div
            onFocus={this.onFocus}
            onBlur={this.onBlur}
            onChange={this.onChange}
            placeholder="Content"
            className="textarea-container"
            contentEditable={true}
          >
            {content}
          </div>
        </div>
      </div>
    );
  }
}

Editor.propTypes = {
  setActiveStyle: PropTypes.func,
  setInactiveStyle: PropTypes.func,
  onChange: PropTypes.func,
  title: PropTypes.string,
  content: PropTypes.string
};
