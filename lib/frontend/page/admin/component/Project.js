import React from 'react';
import querystring from 'querystring';
import { connect } from 'react-redux';
import { setConfig } from '../action/config';
import './Project.scss';

class Component extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      opens: JSON.parse(localStorage.getItem('p_opens') || '{}') || {},
    };
  }

  toggleOpen(key) {
    return () => {
      const { opens } = this.state;
      opens[key] = !opens[key];
      localStorage.setItem('p_opens', JSON.stringify(opens));
      this.setState({
        opens,
      });
    };
  }

  setProjects() {
    this.props.updateProjects(this.props.projects)
      .catch(() => {
        alert('save error');
      });
  }

  addProject = () => {
    const { projects } = this.props;

    const item = {
      id: Date.now(),
      name: '',
      enable: true,
      saveHostname: false,
      rules: [],
    };

    projects.push(item);

    this.toggleOpen(item.id)();

    this.setProjects();
  }

  onChange(obj, key, readValue = 'value') {
    return e => {
      let value = e.target[readValue];
      if (typeof value === 'string') {
        value = value.trim();
      }
      e.target.innerHTML = value;
      e.target.value = value;

      obj[key] = value;

      this.setProjects();
    };
  }

  onDelete(list, item) {
    return () => {
      if (confirm('Delete it ?!')) {
        list.splice(list.indexOf(item), 1);
        this.setProjects();
      }
    };
  }

  onAdd(list) {
    return () => {
      list.push({
        id: Date.now(),
        type: '',
        enable: true,
        match: '',
        to: '',
      });
      this.setProjects();
    };
  }

  render() {
    const { opens } = this.state;
    const { projects } = this.props;
    return (
      <div className="box">
        <h3 className="box-header">
          Projects
        </h3>
        <div className="box-content">
          { projects.map(item => (
            <div className="project-item" key={ item.id }>
              <div className="header">
                <span className='open-state'
                  onClick={ this.toggleOpen(item.id) }>
                  <i className={ opens[item.id] ? 'el-icon-arrow-down' : 'el-icon-arrow-right' }></i>
                </span>
                <input className="enable" type="checkbox" checked={ item.enable }
                  onChange={ this.onChange(item, 'enable', 'checked') }/>

                <span className="name"
                  contentEditable="true"
                  onBlur={ this.onChange(item, 'name', 'innerText') }
                  dangerouslySetInnerHTML={{ __html: item.name }}></span>

                <span className="icon el-icon-delete remove-project"
                  onClick={ this.onDelete(projects, item) }></span>
              </div>
              <div className="content" style={{ display: opens[item.id] ? '' : 'none' }}>
                <ul>
                  { item.rules.map(rule => (
                    <li key={rule.id} className="rule-item">
                      <div className="enable">
                        <input type="checkbox" checked={ rule.enable }
                          onChange={ this.onChange(rule, 'enable', 'checked') }/>
                      </div>
                      <input className="input-text" type="text" value={rule.match} onChange={ this.onChange(rule, 'match') }/>
                      <input className="input-text" type="text" value={rule.to} onChange={ this.onChange(rule, 'to') }/>
                      <div className="operation">
                        <input type="checkbox" checked={ rule.saveHostname }
                          onChange={ this.onChange(rule, 'saveHostname', 'checked') }/>
                        
                        <span className="icon el-icon-delete remove-rule" onClick={ this.onDelete(item.rules, rule) }></span>
                      </div>
                    </li>
                  )) }
                </ul>
                <div className="button-wrap">
                  <button type="button" className="add-rule" onClick={ this.onAdd(item.rules) }>Add</button>
                </div>
              </div>
            </div>
          ))}
          <div className="button-wrap">
            <button type="button" className="add-project" onClick={ this.addProject }>Add</button>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    projects: state.config.projects.map(item => {
      return {
        ...item,
        rules: item.rules.map(rule => {
          const { type, param } = rule;
          const paramCopy = { ...param };
          let to = '';
          if (type === 'http') {
            to = param.url;
          } else if (type === 'status') {
            if (paramCopy.status) {
              delete paramCopy.status;
            }
            const qs = querystring.stringify(paramCopy);
            to = `${type}://${param.status}${qs ? '?' + qs : ''}`;
          } else if (type === 'delay') {
            to = `${type}://${param.delay || 0}`;
          } else if (type === 'host') {
            to = `${type}://${param.hostname}${param.port ? ':' + param.post : ''}`;
          } else if (type === 'file') {
            to = `${type}://${param.path}`;
          } else if (type) {
            to = `${type}://?${querystring.stringify(param)}`;
          }
          return {
            ...rule,
            to,
          };
        }),
      };
    }),
  };
};

const mapDispatchToProps = dispatch => {
  return {
    updateProjects(projects) {
      projects = projects.map(item => {
        return {
          ...item,
          rules: item.rules.map(rule => {
            const { to, saveHostname } = rule;
            let type = /^(\w+):\/\//.test(to) ? RegExp.$1 : '';
            let param;
            if (type === 'http' || type === 'https') {
              param = { url: to };
              type = 'http';
            } else if (type === 'status') {
              param = {
                status: /\/\/(\d+)/.test(to) ? +RegExp.$1 : 0,
                ...querystring.parse(/\?(.+)$/.test(to) ? RegExp.$1 : ''),
              };
            } else if (type === 'delay') {
              param = {
                delay: /\/\/(\d+)/.test(to) ? +RegExp.$1 : '',
                ...querystring.parse(/\?(.+)$/.test(to) ? RegExp.$1 : ''),
              };
            } else if (type === 'host') {
              param = {
                hostname: /\/\/([^:]+)/.test(to) ? RegExp.$1 : '',
                port: /:(\d+)/.test(to) ? +RegExp.$1 : '',
              };
            } else if (type === 'file') {
              param = {
                path: /\/\/(.+)$/.test(to) ? RegExp.$1 : '',
                ...querystring.parse(/\?(.+)$/.test(to) ? RegExp.$1 : ''),
              };
            } else {
              param = {
                ...querystring.parse(/\?(.+)$/.test(to) ? RegExp.$1 : ''),
              };
            }
            param.saveHostname = saveHostname;
            const obj = {
              ...rule,
              type,
              param,
            };
            delete obj.to;
            delete obj.saveHostname;
            return obj;
          }),
        };
      });
      return dispatch(setConfig({
        projects,
      }));
    },
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Component);
