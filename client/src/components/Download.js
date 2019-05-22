import React, { Component } from "react";
import axios from "axios";

class Download extends Component {
  constructor(props) {
    super(props);
    this.state = {
      document: {},
      error: ""
    };
  }

  onClickHandler = () => {
    const data = new FormData();
    data.append("password", document.getElementById("password").value);
    const config = {
      responseType: "",
      headers: { "Content-Type": "multipart/form-data", accept: "" }
    };

    axios
      .post("/api/db/file/" + this.props.match.params.fileId, data, config)
      .then(res => {
        console.log("res", res);
        this.setState({ error: "" });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.download = this.state.document.fileName;
        link.type = this.state.document.fileType;
        document.body.appendChild(link);
        link.click();
      })
      .catch(err => {
        console.error(err);
        this.setState({ error: err.response.data });
      });
  };

  componentDidMount() {
    window.addEventListener("load", async () => {
      const doc = await (await fetch(
        "/api/db/" + this.props.match.params.fileId
      )).json();
      this.setState({ document: doc });
    });
  }

  render = () => {
    const successTemplate = (
      <div>
        <h1>Download Page</h1>
        <div>
          File
          <br />
          Id: {this.props.match.params.fileId}
          <br />
          Name: {this.state.document.fileName}
          <br />
          Type: {this.state.document.fileType}
          <br />
          Expires: {this.state.document.expirationDate}
          <br />
          <input
            type="text"
            id="password"
            name="password"
            placeholder="password"
          />
          <p id="pw-error" className="alert alert-danger">
            <font color="red">{this.state.error}</font>
          </p>
          <br />
          <br />
          <button
            type="button"
            className="btn"
            download
            onClick={this.onClickHandler}
          >
            Download
          </button>
        </div>
      </div>
    );

    const failTemplate = (
      <div>
        <h1>Download Page</h1>
        <div>
          File Not Found
          <br />
          Id: {this.props.match.params.fileId}
          <br />
        </div>
      </div>
    );

    return this.state.document.fileName ? successTemplate : failTemplate;
  };
}

export default Download;
