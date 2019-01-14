import PropTypes from 'prop-types';
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Navbar, Nav, NavItem } from 'react-bootstrap';
import { Route, Redirect, Switch } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';

import DemoMev from '../demo-MEV/DemoMEV';
import DemoP2A from '../demo-P2A/DemoP2A';

const navSpec = [
  { label: 'MEV', path: 'MEV', component: DemoMev },
  { label: 'P2A', path: 'P2A', component: DemoP2A },
];


export default class Template extends React.Component {
  static propTypes = {
  };

  state = {
  };

  render() {
    return (
      <Router basename={'/#'}>
        <div>
          <Navbar fluid>
            <Nav>
              {
                navSpec.map(({label, path}) => (
                  <LinkContainer to={`/${path}`}>
                    <NavItem eventKey={path}>
                      {label}
                    </NavItem>
                  </LinkContainer>
                ))
              }
            </Nav>
          </Navbar>

          <Switch>
            {
              navSpec.map(({path, component}) => (
                <Route path={`/${path}`} component={component}/>
              ))
            }
            <Redirect to={'/P2A'}/>
          </Switch>
        </div>
      </Router>
    );
  }
}
