import React, { Component } from "react";
import axios from "axios";

import Introduction from "./Introduction";

// Styles
import "../styles/base.css";
import "../styles/components/download.css";

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
      responseType: "arraybuffer",
      headers: { "Content-Type": "multipart/form-data", accept: "" }
    };

    axios
      .post("/api/db/file/" + this.props.match.params.fileId, data, config)
      .then(res => {
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
        console.error("Error:", err.response.status);
        const errStatus = err.response.status;
        if (errStatus === 411) {
          this.setState({
            error:
              "The maximum number of downloads has been reached for this document."
          });
        } else if (errStatus === 421) {
          this.setState({
            error: "The document has exceeded its expiration date."
          });
        } else if (errStatus === 401) {
          this.setState({
            error: "The password entered is incorrect."
          });
        }
      });
  };

  componentDidMount() {
    window.addEventListener("load", async () => {
      const doc = await (await fetch(
        "/api/db/" + this.props.match.params.fileId
      )).json();

      if (doc.fileStatus === "DocLimit" || doc.fileStatus === "Expired") {
        this.setState({
          document: doc,
          fileStatusMessage: "Your File is Expired"
        });
      } else {
        this.setState({
          document: doc,
          fileStatusMessage: "Your File is Ready"
        });
      }
    });
  }

  render = () => {
    const successTemplate = (
      <div>
        <h1 className="center header-description header-text">
          {this.state.fileStatusMessage}
        </h1>
        <ul className="flex-container">
          <li className="flex-item">
            <div>
              <div className="note ">
                <p className="center">{this.state.document.fileName}</p>
                <p>Type: {this.state.document.fileType}</p>
                <p>Id: {this.props.match.params.fileId}</p>
                <p>Expires: {this.state.document.expirationDate}</p>
              </div>
              <p className="center">
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Secret Key"
                  className="secret"
                />
              </p>

              <p id="pw-error" className="alert alert-danger center">
                <font color="red">{this.state.error}</font>
              </p>
              <p className="center">
                <button
                  type="button"
                  className="btn"
                  download
                  onClick={this.onClickHandler}
                >
                  Download
                </button>
              </p>
            </div>
          </li>
          <li className="flex-item">{Introduction}</li>
        </ul>
      </div>
    );

    const expiredTemplate = (
      <div>
        <h1 className="center header-description header-text">
          {/* {this.state.fileStatusMessage} */}
          Your File is Expired or Has Reached its Download Limit
        </h1>
        <ul className="flex-container">
          <li className="flex-item">
            <div>
              <div className="note ">
                <p className="center">{this.state.document.fileName}</p>
                <p>Type: {this.state.document.fileType}</p>
                <p>Id: {this.props.match.params.fileId}</p>
                <p>Expires: {this.state.document.expirationDate}</p>
              </div>
              <p className="center">
                This file is no longer available for download
              </p>
            </div>
          </li>
          <li className="flex-item">{Introduction}</li>
        </ul>
      </div>
    );

    const failTemplate = (
      <div>
        <div>
          File Not Found
          <br />
          Id: {this.props.match.params.fileId}
          <br />
        </div>
      </div>
    );

    const returnTemplate = () => {
      if (this.state.document.fileValidity === undefined) {
        return <p />;
      } else if (
        this.state.document.fileValidity &&
        this.state.document.valid
      ) {
        return successTemplate;
      } else if (
        this.state.document.fileValidity &&
        !this.state.document.valid
      ) {
        return expiredTemplate;
      } else {
        return failTemplate;
      }
    };

    return returnTemplate();
  };
}

export default Download;
