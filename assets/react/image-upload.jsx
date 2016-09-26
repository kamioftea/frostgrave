const React = require('react');
//noinspection JSUnusedLocalSymbols
const ReactDOM = require('react-dom');
const Dropzone = require('react-dropzone');

export const ImageUpload = React.createClass({
    render() {
        const {image_url, onDrop} = this.props;

        const cover_image_style = {backgroundImage: "url('" + image_url + "')"};

        return <div className={["upload-image"].join(" ")} style={cover_image_style}>
                    <Dropzone ref="dropzone"
                              onDropAccepted={([file]) => onDrop(file)}
                              multiple={false}
                              className="dropzone"
                              activeClassName="active"
                              rejectClassName="reject"
                              accept="image/*"
                              disablePreview={true}>
                        <div className="message">
                            Click, or drop a file here to upload a new image.
                        </div>
                    </Dropzone>
                </div>
    },
});