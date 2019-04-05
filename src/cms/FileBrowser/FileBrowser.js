import "./FileBrowser.sss";
import Icon from "rc/Icon";
import Loader from "rc/Loader";
import Error from "rc/Error/FetchError";
import { Link } from "react-router-dom";
import usePromise from "hooks/usePromise";
import github from "github";

export default function FileBrowser(props) {
  return "1";
  const [loading, error, data, waitFor] = usePromise(true);
  const prefix = `/tree/${props.branch}/${props.path}/`;

  useEffect(() => {
    waitFor(
      github.repos.getContents({
        owner: props.owner,
        repo: props.repo,
        path: props.path,
        ref: props.branch
      })
    );
  }, [props.branch, props.path]);

  let contents;
  if (loading) {
    contents = <Loader />;
  }
  if (error) {
    contents = <Error />;
  }
  if (data) {
    contents = data.map(d => {
      const Item = types[d.type];
      if (Item) {
        return <Item href={prefix + d.name}>{d.name}</Item>;
      }
    });
  }

  return <div className="FileBrowser">{contents}</div>;
}

const types = {
  dir: props => (
    <Link className="FileBrowser-item FileBrowser-folder" to={props.href}>
      <Icon folder />
      {props.children}
    </Link>
  ),

  file: props => (
    <Link className="FileBrowser-item FileBrowser-file" to={props.href}>
      <Icon file />
      {props.children}
    </Link>
  )
};
