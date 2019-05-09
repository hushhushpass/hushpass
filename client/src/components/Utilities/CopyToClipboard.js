import React from 'react';
// Code courtesy of netsi1964: https://gist.github.com/netsi1964/4d035ad69ef8b1c8f93cc7bf12e72200
 
class CopyToClipboard extends React.Component {
	copy() {
		const textarea = this.textarea;
		let { text, onCopy, silent } = this.props;
		silent =
			typeof silent === "boolean" ||
			silent.toLowerCase() == "true" ||
			silent == "1";
		textarea.value = onCopy.call(this, text);
		textarea.select();

		try {
			const successful = document.execCommand("copy");
			const msg = successful ? "successful" : "unsuccessful";
			if (!silent) {
				prompt("Copying text command was " + msg, textarea.value);
			}
		} catch (err) {
			alert(`Oops, unable to copy (${err.message})`);
		}
	}
	render() {
		const { label } = this.props;
		const attr = {
			style: this.props.style,
			className: this.props.className,
		}
		return (
			<p>
				<button className="btn" onClick={() => this.copy()} {...attr}>
					{label}
				</button>
				<textarea
					ref={textarea => {
						this.textarea = textarea;
					}}
					style={{ position: "absolute", top: "-1000px" }}
				/>
			</p>
		);
	}
}

CopyToClipboard.defaultProps = {
	label: "Copy",
	silent: false,
	text: 'text',
	onCopy: txt => {
		// return "Nothing to copy "+new Date();
		return txt;
	}
};

export default CopyToClipboard;