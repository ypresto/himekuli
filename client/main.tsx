import * as React from "react";
import { Meteor } from "meteor/meteor";
import { render } from "react-dom";

import "material-components-web/dist/material-components-web.css";

import App from "../imports/ui/App";

Meteor.startup(() => {
  render(<App />, document.getElementById("root"));
});
