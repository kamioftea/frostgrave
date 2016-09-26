const React = require('react');
//noinspection JSUnusedLocalSymbols
const ReactDOM = require('react-dom');

export const ClickToEdit = React.createClass({
    getInitialState: () => ({editing: false}),
    willReceiveProps (newProps) {
        if (!this.props.value != newProps.value) {
            this.setState((state) => ({value: state.editing ? state.value : newProps.value}))
        }
    },
    render() {
        const {children, type = 'text', editable} = this.props;
        const {editing, value} = this.state;
        const buttonClass = ['fa', editing ? 'fa-check' : 'fa-pencil'].join(' ');

        const contents = children || value || this.props.value;

        return editable
            ? <form className="row" onSubmit={this.toggleMode}>
                <div className="small-10 columns align-middle">
                    {editing
                        ? ( <input ref={input => input != null ? input.focus() : null}
                                   type={type}
                                   value={value}
                                   onChange={e => this.setState({value: e.target.value})}/> )
                        : contents
                    }
                </div>
                <div className="small-2 columns text-right align-middle">
                    <button
                        type="submit"
                        className="button primary hollow"
                        onClick={this.toggleMode}
                    >
                        <i className={buttonClass}/>
                    </button>
                </div>
            </form>
            : <div className="row">
                <div className="small-12 columns">
                    {contents}
                </div>
            </div>;

    },
    toggleMode(event) {
        event.preventDefault();

        const {editing} = this.state;
        const value = this.state.value === undefined ? this.props.value : this.state.value;

        this.setState({
            editing: !editing,
                     value
        });
        if (editing && typeof this.props.onSubmit === 'function') {
            this.props.onSubmit(value)
        }
    }
});