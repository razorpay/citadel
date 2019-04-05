import github from "github";
import ValidationHelper from "../helper/ValidationHelper";

const owner = "nidhi-tandon";
const repo = "nidhi-tandon.github.io";

export function getContent() {
  return new Promise((resolve, reject) => {
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
        let array = response.tree;
        if (ValidationHelper.isArray(response.tree)) {
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

        resolve(array);
      })
      .catch(error => {
        console.log("error", error);
        reject(error);
      });
  });
}

export const getTextContent = path => {
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
        let res = !ValidationHelper.isArray(result)
          ? atob(result.content)
          : result;
        resolve(res);
      })
      .catch(error => {
        reject(error);
      });
  });
};

export const deleteFile = file => {
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

const createPR = (title, headBranch, baseBranch = "master") => {
  github.pulls
    .create({
      owner: owner,
      repo: repo,
      title: title,
      head: headBranch,
      base: baseBranch,
      headers: { Accept: "application/vnd.github.v3.diff" }
    })
    .then(result => {})
    .catch(error => {
      console.log("error", error);
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
