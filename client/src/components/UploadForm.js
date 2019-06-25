import React, { Component } from "react";
import axios from "axios";
import CopyToClipboard from "./Utils/CopyToClipboard";

// Styles
import "../styles/base.css";
import "../styles/components/upload.css";

import Dropzone from "react-dropzone";
import Introduction from "./Introduction";

class UploadForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedFile: null,
      fileId: null,
      showConfirmation: false,
      error: null
    };
  }

  onClearCurrentFile = () => {
    this.setState({
      selectedFile: null,
      fileId: null,
      showConfirmation: false,
      error: null
    });
    document.getElementById("key").value = "";
    document.getElementById("downloads").value = "";
    document.getElementById("expiration").value = "";
    document.getElementById("tosCheckBox").checked = false;
  };

  async onDropZone(acceptedFiles) {
    await this.setState({
      selectedFile: acceptedFiles[0]
    });
    if (acceptedFiles[0].size > 25 * 1048576) {
      this.setState({
        error:
          "File must be 25MB or below. Your file is " +
          (acceptedFiles[0].size / 1048576).toFixed(2) +
          "MB"
      });
    } else {
      this.setState({
        error: null
      });
    }
  }

  onClickHandler = () => {
    if (!this.state.selectedFile) {
      this.setState({ error: "Please include a file" });
      return "Please include a file";
    } else if (!document.getElementById("key").value.trim()) {
      this.setState({ error: "Please include a secret key" });
      return "Please include a secret key";
    } else if (!document.getElementById("tosCheckBox").checked) {
      this.setState({
        error: "Please agree to the conditions of use before continuing"
      });
      return "Please agree to the conditions of use before continuing";
    } else if (this.state.selectedFile.size > 25 * 1048576) {
      this.setState({
        error:
          "File must be 25mb or below. Your file is " +
          (this.state.selectedFile.size / 1048576).toFixed(2) +
          "b"
      });
      return (
        "File must be 50mb or below. Your file is " +
        this.state.selectedFile.size / 1048576 +
        "b"
      );
    } else if (document.getElementById("downloads").value > 100) {
      this.setState({
        error: "The number of downloads is limited to 100"
      });
      return "The number of downloads is limited to 100";
    } else if (document.getElementById("expiration").value > 7) {
      this.setState({
        error: "The number of days available is limited to 7"
      });
      return "The number of days available is limited to 7";
    } else {
      this.setState({ error: null });
    }

    const data = new FormData();

    data.append("file", this.state.selectedFile);
    data.append("key", document.getElementById("key").value);
    data.append(
      "downloads",
      document.getElementById("downloads").value
        ? document.getElementById("downloads").value
        : 1
    );
    data.append(
      "expiration",
      document.getElementById("expiration").value
        ? document.getElementById("expiration").value
        : 1
    );

    const config = { headers: { "Content-Type": "multipart/form-data" } };

    axios
      .post("/api/db/upload/", data, config)

      .then(res => {
        // console.log("res: ", res);
        this.setState({
          showDownloadForm: false,
          fileId: res.data
        });
        document.getElementById("getFilePathBtn").click();
      })
      .catch(err => {
        console.log("Upload Failed\n" + err);
      });
  };

  render() {
    return (
      <section component="UploadForm">
        <div id="body">
          <div className="header">
            <h1 className="header-text">
              <span className="brand-dark">Hush</span>
              <span className="brand-white">Hush</span>
            </h1>
            <span className="header-description">Share Files Securely.</span>
          </div>

          <ul className="flex-container">
            <li className="flex-item">
              <div className="uploadForm-container">
                <div className="uploadForm ">
                  <div className="form-row ">
                    <Dropzone
                      onDrop={acceptedFiles => this.onDropZone(acceptedFiles)}
                    >
                      {({ getRootProps, getInputProps }) => (
                        <section>
                          <div {...getRootProps()}>
                            <input {...getInputProps()} />
                            {!this.state.selectedFile ? (
                              <div className="dropzone ">
                                <p className="file-icon ">
                                  <i className="far fa-file center" />
                                </p>
                                <p className="center">Drag and drop a file</p>
                                <p className="center">
                                  <span className="underline">click here</span>
                                </p>
                                <p className="center">to select a file</p>
                              </div>
                            ) : (
                              <p className="dropzone center">
                                File Set: {this.state.selectedFile.name}
                              </p>
                            )}
                          </div>
                        </section>
                      )}
                    </Dropzone>
                  </div>
                  <div className="form-row  center">
                    <input
                      type="password"
                      name="key"
                      id="key"
                      placeholder="Your Secret Key"
                      className="row key"
                    />
                  </div>
                  <div className="form-row center">
                    <input
                      placeholder="Days until expiration"
                      type="number"
                      min="1"
                      max="7"
                      name="expiration"
                      id="expiration"
                      className="row num-input expiration"
                    />
                  </div>

                  <div className="form-row center">
                    <input
                      placeholder="Number of Downloads"
                      type="number"
                      min="1"
                      max="100"
                      name="downloads"
                      id="downloads"
                      className="row num-input downloads"
                    />
                  </div>
                  <div className="form-row center">
                    <label className="tosBox">
                      <input type="checkbox" id="tosCheckBox" />
                      <span className="checkable">
                        By uploading I agree to use this site in a lawful maner
                        and assume all responcibility for my use of it.
                      </span>
                    </label>
                  </div>

                  <div className="form-row center">
                    <label className="">
                      <div className="error ">{this.state.error}</div>
                    </label>
                  </div>

                  <div className="row center">
                    {this.state.fileId ? (
                      <div>
                        <label
                          htmlFor="modal_1"
                          className="button row"
                          id="getFilePathBtn"
                        >
                          <div>Get shareable link</div>
                        </label>

                        <label
                          htmlFor="modal_1"
                          className="button row"
                          onClick={this.onClearCurrentFile}
                        >
                          Upload another file
                        </label>
                      </div>
                    ) : (
                      <label
                        htmlFor="modal_1"
                        className="button"
                        id="upload-btn"
                        onClick={this.onClickHandler}
                      >
                        Upload
                      </label>
                    )}

                    {this.state.fileId && (
                      <div className="modal">
                        <input id="modal_1" type="checkbox" />
                        <label htmlFor="modal_1" className="overlay" />
                        <article className="modal-article">
                          <header>
                            <h3>
                              Upload Complete - Your file is safely in our hands
                            </h3>
                            <label htmlFor="modal_1" className="close">
                              &times;
                            </label>
                          </header>
                          <section className="content">
                            <div className="flex-row copy-box">
                              Copy your file location
                              {
                                <CopyToClipboard
                                  className="btn copy-btn "
                                  text={`${window.location.href}download/${
                                    this.state.fileId
                                  }`}
                                />
                              }
                            </div>

                            <div className="flex-row modal-brief">
                              <p>
                                Your file's been encrypted and stored in our
                                database. Only you and the people you share your
                                password with are capable of seeing your file.
                              </p>
                              <p>
                                Keep track of your password! The recipient will
                                need it to download the file.
                              </p>
                            </div>
                            <div className="flex-row ">
                              <label
                                htmlFor="modal_1"
                                className="button dangerous"
                              >
                                Close
                              </label>
                            </div>
                          </section>
                        </article>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
            <li className="flex-item ">{Introduction}</li>
          </ul>
        </div>
      </section>
    );
  }
}
export default UploadForm;
