import React, { Component } from 'react';
import { Grid, Row, Col } from 'react-bootstrap';

import meta from '../../assets/meta'
import './App.css';
import VariableSelector from '../VariableSelector';

function stringify(obj) {
  return <pre>{JSON.stringify(obj, null, 2)}</pre>;
}

class App extends Component {
  state = {
    variable: null,
  };

  handleChangeVariable = variable => this.setState({ variable });

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col lg={3}>
            <VariableSelector
              meta={meta}
              variable={this.state.variable}
              onChange={this.handleChangeVariable}
            />
          </Col>
        </Row>
        <Row>
          <Col lg={3}>
            {stringify(this.state.variable && this.state.variable.value)}
          </Col>
        </Row>
      </Grid>
    );
  }
}

export default App;
