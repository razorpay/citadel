import { getContent, getTextContent, deleteFile } from "../../state/content";
import { getUser, setToken } from "../../state/user";
import Button from "rc/Button";
import Icon from "rc/Icon";
import Flex from "rc/Flex";
import Loader from "rc/Loader";
import "./MainScreen.sss";
import remark from "remark";
import remark2react from "remark-react";
import { getTree } from "github";
import React, { PureComponent } from "react";
import ValidationHelper from "../../helper/ValidationHelper";
import { withRouter } from "react-router-dom";
import EditorContainer from "./components";

const authUrl =
  "https://github.com/login/oauth/authorize?client_id=6c3b837d0c1a075aac92&scope=repo";

export default class MainScreen extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      tree: [],
      file: [],
      isShowContentEnabled: false,
      isDropdownEnabled: false,
      fetchedIndex: 0,
      loading: false,
      token: "",
      loggedIn: false,
      user: ""
    };
  }

  fetchUser() {
    getUser().then(response => {
      this.setState({
        user: response.data
      });
    });
  }

  popup;

  login = () => {
    if (this.popup) {
      this.popup.location = authUrl;
    } else {
      this.popup = open(authUrl);
    }
    onmessage = e => {
      try {
        const data = JSON.parse(e.data);
        if (data.github_access_token) {
          setToken(data.github_access_token).then(response => {
            this.setState({
              user: response.data,
              loading: false,
              loggedIn: true
            });
          });
        }
        this.popup.close();
        this.popup = null;
        getContent().then(response => {
          this.setState({
            tree: response
          });
        });
      } catch (e) {
        console.log("login error", e);
      }
    };
    const checkClose = setInterval(() => {
      if (!this.popup || this.popup.closed) {
        clearInterval(checkClose);
        onmessage = null;
      }
    });
  };

  fetchSpecificContent(event, obj, index) {
    event.stopPropagation();
    console.log("path", obj);
    this.fetchTextContent(obj, event, index);

    // props.history.push(`${obj.path}`);
  }

  enableEditor = (e, obj, index) => {
    e.stopPropagation();
    getTextContent(obj.path).then(response => {
      this.setState(
        {
          file: response,
          isShowContentEnabled: true
        },
        () => {
          this.displayDropdown(event, index);
        }
      );
    });
  };

  handleDeleteFile = (e, obj, index) => {
    e.stopPropagation();
    deleteFile(obj).then(response => {
      this.displayDropdown(e, index);
    });
  };

  displayDropdown = (e, index) => {
    this.setState(
      {
        isDropdownEnabled: !this.state.isDropdownEnabled,
        fetchedIndex: index
      },
      () => {
        console.log(
          "isDropDownEnabled",
          this.state.isDropDownEnabled,
          "fetchedIndex",
          this.state.fetchedIndex
        );
      }
    );
  };

  closeEditor = () => {
    this.setState({
      isShowContentEnabled: false
    });
  };

  fetchTextContent = (obj, event, index) => {
    getTextContent(obj.path).then(response => {
      this.setState(
        {
          file: response
        },
        () => {
          this.displayDropdown(event, index);
        }
      );
    });
  };

  render() {
    let {
      user,
      loading,
      loggedIn,
      isShowContentEnabled,
      file,
      tree,
      isDropdownEnabled,
      fetchedIndex
    } = this.state;
    console.log(
      "isDropdownEnabled--",
      isDropdownEnabled,
      "fetchedIndex--",
      fetchedIndex
    );
    return (
      <div>
        <Flex className="MainScreen">
          {loading ? (
            <Loader />
          ) : !loggedIn ? (
            <Button onClick={this.login} m="auto">
              <Icon github /> Login
            </Button>
          ) : isShowContentEnabled ? (
            <EditorContainer content={file} close={this.closeEditor} />
          ) : (
            <React.Fragment>
              <Flex className="Topbar">
                <img src={user.avatar_url} />
              </Flex>
              <div className="ContentContainer">
                <Flex className="SideMenu">
                  <ul style={{ width: "100%" }}>
                    {tree.map(obj => {
                      console.log("obj", obj);
                      let file = obj.files;
                      return (
                        <li>
                          {obj.files && obj.type === "tree" ? (
                            <React.Fragment>
                              {obj.path}
                              <ul>
                                {file.map((fileObj, index) => {
                                  return (
                                    <li>
                                      {fileObj.name}
                                      <div className="dropdown-container">
                                        <span
                                          onClick={e =>
                                            this.displayDropdown(e, index)
                                          }
                                          className="dropdown-trigger"
                                        >
                                          ...
                                        </span>
                                        {isDropdownEnabled &&
                                          fetchedIndex === index && (
                                            <div className="dropdown">
                                              <div
                                                onClick={e =>
                                                  this.fetchSpecificContent(
                                                    e,
                                                    obj,
                                                    index
                                                  )
                                                }
                                                className="dropdown-values"
                                              >
                                                {" "}
                                                View
                                              </div>
                                              <div
                                                onClick={e =>
                                                  this.enableEditor(
                                                    e,
                                                    obj,
                                                    index
                                                  )
                                                }
                                                className="dropdown-values"
                                              >
                                                {" "}
                                                Edit
                                              </div>
                                              <div
                                                className="dropdown-values"
                                                onClick={e =>
                                                  this.handleDeleteFile(
                                                    e,
                                                    obj,
                                                    index
                                                  )
                                                }
                                              >
                                                {" "}
                                                Delete
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </React.Fragment>
                          ) : (
                            <React.Fragment>
                              {obj.path}
                              <div className="dropdown-container">
                                <span
                                  onClick={e => this.displayDropdown(e, "11")}
                                  className="dropdown-trigger"
                                >
                                  ...
                                </span>
                                {isDropdownEnabled && fetchedIndex === "11" && (
                                  <div className="dropdown">
                                    <div
                                      onClick={e =>
                                        this.fetchSpecificContent(e, obj, "11")
                                      }
                                      className="dropdown-values"
                                    >
                                      {" "}
                                      View
                                    </div>
                                    <div
                                      onClick={e =>
                                        this.enableEditor(e, obj, "11")
                                      }
                                      className="dropdown-values"
                                    >
                                      {" "}
                                      Edit
                                    </div>
                                    <div
                                      className="dropdown-values"
                                      onClick={e =>
                                        this.handleDeleteFile(e, obj, "11")
                                      }
                                    >
                                      {" "}
                                      Delete
                                    </div>
                                  </div>
                                )}
                              </div>
                            </React.Fragment>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Flex>
                {!ValidationHelper.isEmpty(file) && (
                  <Flex className="Description">
                    Content
                    <div>
                      {
                        remark()
                          .use(remark2react)
                          .processSync(file).contents
                      }
                    </div>
                  </Flex>
                )}
              </div>
            </React.Fragment>
          )}
        </Flex>
      </div>
    );
  }
}
