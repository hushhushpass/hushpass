import React, { Component } from 'react';
import axios from 'axios';
// Components
import Confirmation from './Confirmation';

class Landing extends Component{
    constructor(props){
        super(props);
        this.state= {
            selectedFile: null,
            fileId: null,
            loaded: 0, 
            showConfirmation: false
        }
    }

    onChangeHandler= async (event)=>{

        const file = event.target.files[0];
        
        await this.setState({
            selectedFile: file
        });
    }

    onClickHandler = () => {
        const data = new FormData();
        data.append("file",this.state.selectedFile, 'file-name');
        data.append('key',document.getElementById('key').value);

        const config = { headers:{'Content-Type':'multipart/form-data'}};

        console.log('axios',this.state.selectedFile.size);
        if(this.state.selectedFile.size / (1000000) > 5) {
            alert('This file exceeds our 5mb limit. ')
            return false; 
        }

        axios.post("/api/db/upload/", data, config)
        
        .then(res => { 
            console.log('res: ',res);
            this.setState({
                showDownloadForm: false, 
                fileId: res.data
            });
        })
        .catch(err => { 
            console.log("Upload Failed\n"+err);
        })


    }

    test = () =>{

        axios.get("/api/db/upload/").then(res=>{
            console.log('sent');
        });
    }

    renderForm () {
        const Upload = (
            <div id='body'>
                <form >
                    <input type='text' name='key' id='key' placeholder='Your Secret Key'/>
                    <input type='file' name='file' className="form-control" onChange={this.onChangeHandler}/>
                    <button type="button" className="btn" onClick={this.onClickHandler}>Upload</button>
                </form>
            </div>
        )
      

        if(this.state.fileId) {
            return Confirmation;
        } else {
            return Upload
        }  
            
    }
    
    render() {
        return (
            <section component='landing'>

                <div style={{ textAlign: 'center' }}>
                    <h1>HushPass</h1>
                    <span>Share Files Securely.</span>
                </div>

                {!this.state.fileId ? 
                <div id='body'>
                    <form >
                        <input type='text' name='key' id='key' placeholder='Your Secret Key'/>
                        <input type='file' name='file' className="form-control" onChange={this.onChangeHandler}/>
                        <button type="button" className="btn" onClick={this.onClickHandler}>Upload</button>
                    </form>
                </div> 
                : <Confirmation fileId={this.state.fileId} /> }

                <button type="button" className="btn" onClick={this.test}>test</button>

            </section>
        );
    }

}
export default Landing; 