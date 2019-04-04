import useLogin from "state/user";
import useContent from "state/content";
import Button from "rc/Button";
import Icon from "rc/Icon";
import Flex from "rc/Flex";
import Loader from "rc/Loader";
import "./MainScreen.sss";
import remark from "remark";
import remark2react from "remark-react";
import { getTree } from "github";
import React from "react";
import ValidationHelper from "../../helper/ValidationHelper";
import { withRouter } from "react-router-dom";
import EditorContainer from "./components";

export default withRouter(props => {
  const [user, login, logged_in, loading] = useLogin();
  const [
    tree,
    getContent,
    file,
    getTextContent,
    isShowContentEnabled,
    showContent,
    isDropdownEnabled,
    showDropdown,
    deleteFile,
    closeShowContent,
    fetchedIndex
  ] = useContent();

  console.log("tree", tree, user);

  const fetchDetails = () => {
    login();
    getContent();
  };

  function fetchSpecificContent(event, obj, index) {
    event.stopPropagation();
    console.log("path", obj);
    getTextContent(obj.path);
    displayDropdown(event, index);
    // props.history.push(`${obj.path}`);
  }

  const enableEditor = (e, obj, index) => {
    e.stopPropagation();
    showContent(obj.path);
    displayDropdown(e, index);
  };

  const handleDeleteFile = (e, obj, index) => {
    e.stopPropagation();
    deleteFile(obj);
    displayDropdown(e, index);
  };

  const displayDropdown = (e, index) => {
    showDropdown(index);
  };

  const closeEditor = () => {
    closeShowContent();
  };

  let content;
  if (loading) {
    content = <Loader />;
  } else if (!logged_in) {
    content = (
      <Button onClick={fetchDetails} m="auto">
        <Icon github /> Login
      </Button>
    );
  } else {
    content = isShowContentEnabled ? (
      <EditorContainer content={file} close={closeEditor} />
    ) : (
      <React.Fragment>
        <Flex className="Topbar">
          <img src={user.data.avatar_url} />
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
                                    onClick={e => displayDropdown(e, index)}
                                    className="dropdown-trigger"
                                  >
                                    ...
                                  </span>
                                  {isDropdownEnabled && fetchedIndex === index && (
                                    <div className="dropdown">
                                      <div
                                        onClick={e =>
                                          fetchSpecificContent(e, obj, index)
                                        }
                                        className="dropdown-values"
                                      >
                                        {" "}
                                        View
                                      </div>
                                      <div
                                        onClick={e =>
                                          enableEditor(e, obj, index)
                                        }
                                        className="dropdown-values"
                                      >
                                        {" "}
                                        Edit
                                      </div>
                                      <div
                                        className="dropdown-values"
                                        onClick={e =>
                                          handleDeleteFile(e, obj, index)
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
                            onClick={e => displayDropdown(e, "11")}
                            className="dropdown-trigger"
                          >
                            ...
                          </span>
                          {isDropdownEnabled && fetchedIndex === "11" && (
                            <div className="dropdown">
                              <div
                                onClick={e =>
                                  fetchSpecificContent(e, obj, "11")
                                }
                                className="dropdown-values"
                              >
                                {" "}
                                View
                              </div>
                              <div
                                onClick={e => enableEditor(e, obj, "11")}
                                className="dropdown-values"
                              >
                                {" "}
                                Edit
                              </div>
                              <div
                                className="dropdown-values"
                                onClick={e => handleDeleteFile(e, obj, "11")}
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
    );
  }

  return (
    <div>
      <Flex className="MainScreen">{content}</Flex>
    </div>
  );
});
