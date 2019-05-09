import React from 'react';
import { Link } from 'react-router-dom'
// Components 
import CopyToClipboard from './Utilities/CopyToClipboard';

const Confirmation = (props) => {

    return (
        <section component="Confirmation">
            <h1>Confirmation</h1>
            <Link to={`/download/${props.fileId}`}>Click here to visit the download page</Link>
            {props.fileId && <CopyToClipboard  className="btn" text={`${window.location.href}download/${props.fileId}`}/>}
        </section>
    )
}

export default Confirmation; 