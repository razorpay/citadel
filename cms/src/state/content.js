import { Atom, swap, useAtom, deref } from "hooks/useAtom";
import github from "github";
import ValidationHelper from "../helper/ValidationHelper";

const initialState = {
  tree: null,
  file: null,
  isShowContentEnabled: false,
  isDropDownEnabled: false,
  fetchedIndex: ""
};

const content = Atom.of(initialState);

const getContent = () => {
  const { tree } = deref(content);
  if (!tree) {
    github.git
      .getTree({
        owner: "nidhi-tandon",
        repo: "nidhi-tandon.github.io",
        tree_sha: "694a36970728b0e466848ca576e86ccb6d8a2e3d",
        client_id: "97ea4080913caf42c3e6",
        client_secret: "e541c36d0764a35bff8d3dd6d46ed056b2a2b009"
      })
      .then(response => {
        console.log("response", response.tree);

        if (ValidationHelper.isArray(response.tree)) {
          let array = response.tree;
          array.map(obj => {
            if (obj.type === "tree") {
              console.log("getTextContent Inside", getTextContent(obj.path));
              getTextContent(obj.path).then(file => {
                if (ValidationHelper.isArray(file)) {
                  obj.files = file;
                } else {
                  obj.file = atob(file.content);
                }
              });
            }
          });
        }

        swap(content, state => ({
          ...state,
          tree: response.tree
        }));
      })
      .catch(error => {});
  }
};

const getTextContent = path => {
  return new Promise((resolve, reject) => {
    github.repos
      .getContents({
        owner: "nidhi-tandon",
        repo: "nidhi-tandon.github.io",
        path: `/${path}`,
        client_id: "97ea4080913caf42c3e6",
        client_secret: "e541c36d0764a35bff8d3dd6d46ed056b2a2b009"
      })
      .then(result => {
        console.log("getTextContent", result);
        swap(content, state => ({
          ...state,
          file: !ValidationHelper.isArray(result)
            ? atob(result.content)
            : result
        }));

        resolve(result);
      })
      .catch(error => {
        reject(error);
      });
  });
};

const deleteFile = file => {
  console.log("deleteFile - File", file);
  return new Promise((resolve, reject) => {
    github.repos
      .deleteFile({
        owner: "nidhi-tandon",
        repo: "nidhi-tandon.github.io",
        path: file.path,
        message: "Deleting file",
        sha: file.sha,
        branch: "master",
        client_id: "97ea4080913caf42c3e6",
        client_secret: "e541c36d0764a35bff8d3dd6d46ed056b2a2b009"
      })
      .then(result => {
        console.log("deleteFile - Result", result);
        getContent();
        resolve(result);
      })
      .catch(error => {
        console.log("deleteFile - Error", error);
        reject(error);
      });
  });
};

const createComment = (comment, file) => {
  github.pulls
    .createComment({
      owner: "nidhi-tandon",
      repo: "nidhi-tandon.github.io",
      number,
      body: comment,
      commit_id,
      path: file.path,
      position
    })
    .then(result => {});
};

const createCommentOnComment = (comment, commentId) => {
  github.pulls
    .createComment({
      owner: "nidhi-tandon",
      repo: "nidhi-tandon.github.io",
      number,
      body: comment,
      in_reply_to: commentId,
      position
    })
    .then(result => {});
};

const createReviewRequest = () => {
  github.pulls
    .createReviewRequest({
      owner: "nidhi-tandon",
      repo: "nidhi-tandon.github.io",
      number
    })
    .then(result => {});
};

const showContent = path => {
  console.log("path", path);
  getTextContent(path).then(() => {
    swap(content, state => ({
      ...state,
      isShowContentEnabled: true
    }));
  });
};

const showDropdown = index => {
  console.log("showDropdown", index);
  swap(content, state => ({
    ...state,
    isDropDownEnabled: !state.isDropDownEnabled,
    fetchedIndex: index
  }));
};

const closeShowContent = () => {
  swap(content, state => ({
    ...state,
    isShowContentEnabled: false
  }));
};

export default () => {
  const {
    tree,
    file,
    isShowContentEnabled,
    isDropDownEnabled,
    fetchedIndex
  } = useAtom(content);
  return [
    tree,
    getContent,
    file,
    getTextContent,
    isShowContentEnabled,
    showContent,
    isDropDownEnabled,
    showDropdown,
    deleteFile,
    closeShowContent,
    fetchedIndex
  ];
};
