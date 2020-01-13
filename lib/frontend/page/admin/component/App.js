import React from 'react';
import { connect } from 'react-redux';
import './App.scss';
import Project from './Project';
import { getConfig, setConfig } from '../action/config';

class Component extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      sideWidth: 0,
      showSettings: false,
    };
  }

  componentDidMount() {
    window.addEventListener('message', e => {
      const data = JSON.parse(e.data);
      if (data.event == '_onResizeEnd' && data.data > 0) {
        const sideWidth = Math.max(data.data - 30, 0);
        // console.log('_onResizeEnd:', e.data);
        this.setState({
          sideWidth,
        });
      }
    });
    window.addEventListener('resize', this.onResize);
  }

  onResize = () => {
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  onOpenSettings = () => {
    this.props.dispatch(getConfig());

    this.setState({
      showSettings: true,
    });
  }

  onCloseSettings = () => {
    this.setState({
      showSettings: false,
    });
  }

  setHttps = e => {
    const enable = e.target.checked;

    this.props.dispatch(setConfig({
      https: enable,
    }));
  }

  render() {
    const { state } = this;
    const { config } = this.props;
    return (
      <div>
        <iframe className="devtools" src={config.devtoolsURL} frameBorder="0"
          style={{ width: state.width + 'px', height: state.height + 'px' }}></iframe>
        <div className="dialog" style={{ display: (state.showSettings || +this.sideWidth) ? '' : 'none' }} style={{width: (state.sideWidth ? (state.sideWidth + 'px') : 'calc(100% - 30px)')}}>
          <div className="dialog-content">
            <div className="box">
              <h3 className="box-header">
                FEProxy
              </h3>
              <div className="box-content">
                <div className="settings-item">
                  <input className="enable" type="checkbox" checked={ config.https || false }
                    onChange={ this.setHttps }/>
                  https
                </div>
              </div>
            </div>
            <Project />
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  state => ({
    ...state,
  }),
  dispatch => ({
    dispatch,
  })
)(Component);
