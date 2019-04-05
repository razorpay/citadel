import { BrowserRouter } from "react-router-dom";
import { hot } from "react-hot-loader/root";

import "./cms.font";
import "./App.sss";
import ThemeProvider from "rc/ThemeProvider";
import "rc/ThemeProvider/reset.sss";
import MainScreen from "cms/MainScreen";
import Editor from "./cms/Editor/Editor";

const HotApp = hot(function App() {
  return (
    <ThemeProvider props={{}}>
      <BrowserRouter>
        <MainScreen props={this} />
        {/*<Editor props={this} />*/}
      </BrowserRouter>
    </ThemeProvider>
  );
});

ReactDOM.render(<HotApp />, document.body.firstElementChild);
