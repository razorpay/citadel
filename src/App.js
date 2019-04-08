import { BrowserRouter } from "react-router-dom";
import { hot } from "react-hot-loader/root";

import "./cms.font";
import "./App.sss";
// import ThemeProvider from "rc/ThemeProvider";
import "rc/ThemeProvider/reset.sss";
import MainScreen from "../src/cms/MainScreen";

const HotApp = hot(function App() {
  return (
    // <ThemeProvider props={{}}>
      <BrowserRouter>
        <MainScreen />
        {/*<Editor props={this} />*/}
      </BrowserRouter>
    // </ThemeProvider>
  );
});

ReactDOM.render(<HotApp />, document.body.firstElementChild);
