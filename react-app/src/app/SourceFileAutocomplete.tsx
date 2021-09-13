import { store } from "statorgfc";
import constants from "./constants";
import Actions from "./Actions";
import Util from "./Util";
import FileOps from "./FileOps";
import React from "react";
import _ from "lodash";
import Awesomplete from "awesomplete";
/**
 * The autocomplete dropdown of source files is complicated enough
 * to have its own component. https://leaverou.github.io/awesomplete/
 */

const help_text = "Enter file path to view, press enter";
class SourceFileAutocomplete extends React.Component {
  awesomeplete_input: any;
  html_input: any;
  constructor() {
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 1-2 arguments, but got 0.
    super();
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'subscribeToKeys' does not exist on type ... Remove this comment to see the full error message
    store.subscribeToKeys(["source_file_paths"], this.store_change_callback.bind(this));
  }
  store_change_callback() {
    if (this.awesomeplete_input) {
      if (!_.isEqual(this.awesomeplete_input._list, store.get("source_file_paths"))) {
        this.awesomeplete_input.list = store.get("source_file_paths");
      }
    }
  }
  render() {
    return (
      <div style={{ width: "100%", flex: "1 0", padding: "5px" }} className="flex">
        <input
          id="source_file_input"
          autoComplete="off"
          placeholder={help_text}
          title={help_text}
          className="dropdown-input"
          onKeyUp={this.keyup_source_file_input.bind(this)}
          role="combobox"
          ref={(el) => (this.html_input = el)}
          style={{ width: "100%" }}
        />
        <button
          id="source_file_dropdown_button"
          style={{ float: "right" }}
          type="button"
          className="dropdown-btn"
          onClick={this.onclick_dropdown.bind(this)}
        >
          <span className="caret" />
        </button>
      </div>
    );
  }
  keyup_source_file_input(e: any) {
    if (e.keyCode === constants.ENTER_BUTTON_NUM) {
      let user_input = _.trim(e.currentTarget.value);

      if (user_input.length === 0) {
        return;
      }

      let fullname,
        default_line = 0,
        line;
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
      [fullname, line] = Util.parse_fullname_and_line(user_input, default_line);
      FileOps.userSelectFileToView(fullname, line);
    } else if (store.get("source_file_paths").length === 0) {
      // source file list has not been fetched yet, so fetch it
      Actions.fetch_source_files();
    }
  }
  onclick_dropdown() {
    if (store.get("source_file_paths").length === 0) {
      // we have not asked gdb to get the list of source paths yet, or it just doesn't have any.
      // request that gdb populate this list.
      Actions.fetch_source_files();
      return;
    }

    if (this.awesomeplete_input.ul.childNodes.length === 0) {
      this.awesomeplete_input.evaluate();
    } else if (this.awesomeplete_input.ul.hasAttribute("hidden")) {
      this.awesomeplete_input.open();
    } else {
      this.awesomeplete_input.close();
    }
  }
  componentDidMount() {
    // initialize list of source files
    // TODO maybe use a pre-built React component for this
    this.awesomeplete_input = new Awesomplete("#source_file_input", {
      minChars: 0,
      maxItems: 10000,
      list: [],
      // standard sort algorithm (the default Awesomeplete sort is weird)
      sort: (a: any, b: any) => {
        return a < b ? -1 : 1;
      },
    });

    // perform action when an item is selected
    this.html_input.addEventListener("awesomplete-selectcomplete", function (e: any) {
      let fullname = e.currentTarget.value;
      FileOps.userSelectFileToView(fullname, 1);
    });
  }
}

export default SourceFileAutocomplete;
